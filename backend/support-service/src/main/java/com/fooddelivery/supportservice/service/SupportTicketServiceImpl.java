package com.fooddelivery.supportservice.service;

import com.fooddelivery.supportservice.client.*;
import com.fooddelivery.supportservice.dto.ticket.*;
import com.fooddelivery.supportservice.entity.*;
import com.fooddelivery.supportservice.exception.ApiException;
import com.fooddelivery.supportservice.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.time.Year;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class SupportTicketServiceImpl implements SupportTicketService {

    private final SupportTicketRepository ticketRepo;
    private final TicketReplyRepository   replyRepo;
    private final AuthServiceClient       authClient;
    private final UserServiceClient       userClient;
    private final RestaurantServiceClient restaurantClient;

    // ── Create ticket ──────────────────────────────────────

    @Override
    public TicketResponse createTicket(String userId, TicketRequest req) {
        // Validate user exists
        validateUserExists(userId);

        // Validate restaurant if provided
        if (req.getRestaurantId() != null && !req.getRestaurantId().isBlank())
            validateRestaurantExists(req.getRestaurantId());

        String userName  = fetchUserName(userId);
        String userEmail = fetchUserEmail(userId);

        SupportTicket ticket = SupportTicket.builder()
                .ticketNumber(generateTicketNumber())
                .userId(userId)
                .userName(userName)
                .userEmail(userEmail)
                .category(req.getCategory())
                .orderId(req.getOrderId())
                .restaurantId(req.getRestaurantId())
                .subject(req.getSubject())
                .description(req.getDescription())
                .status(SupportTicket.TicketStatus.OPEN)
                .priority(SupportTicket.Priority.MEDIUM)
                .updatedBy(userId)
                .build();

        SupportTicket saved = ticketRepo.save(ticket);
        log.info("Ticket {} created by userId: {}",
                saved.getTicketNumber(), userId);
        return TicketResponse.from(saved);
    }

    // ── Get ticket ─────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public TicketResponse getTicket(String ticketId, String requesterId,
                                     String role) {
        SupportTicket ticket = ticketRepo.findById(ticketId)
                .orElseThrow(() -> new ApiException("Ticket not found",
                        HttpStatus.NOT_FOUND, "TICKET_NOT_FOUND"));

        // Non-admin can only see their own tickets
        if (!isAdminOrManager(role)
                && !ticket.getUserId().equals(requesterId))
            throw new ApiException("Access denied — not your ticket",
                    HttpStatus.FORBIDDEN, "ACCESS_DENIED");

        return TicketResponse.from(ticket);
    }

    @Override
    @Transactional(readOnly = true)
    public TicketResponse getByTicketNumber(String ticketNumber,
                                             String requesterId, String role) {
        SupportTicket ticket = ticketRepo.findByTicketNumber(ticketNumber)
                .orElseThrow(() -> new ApiException(
                        "Ticket not found: " + ticketNumber,
                        HttpStatus.NOT_FOUND, "TICKET_NOT_FOUND"));

        if (!isAdminOrManager(role)
                && !ticket.getUserId().equals(requesterId))
            throw new ApiException("Access denied — not your ticket",
                    HttpStatus.FORBIDDEN, "ACCESS_DENIED");

        return TicketResponse.from(ticket);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TicketResponse> getMyTickets(String userId, String status,
                                              int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        if (status != null && !status.isBlank()) {
            return ticketRepo.findByUserIdAndStatusOrderByCreatedAtDesc(
                    userId, parseStatus(status), pageable)
                    .map(TicketResponse::from);
        }
        return ticketRepo.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(TicketResponse::from);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TicketResponse> getAllTickets(String status,
                                              int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        if (status != null && !status.isBlank()) {
            return ticketRepo.findByStatusOrderByCreatedAtDesc(
                    parseStatus(status), pageable).map(TicketResponse::from);
        }
        return ticketRepo.findAllByOrderByCreatedAtDesc(pageable)
                .map(TicketResponse::from);
    }

    // ── Customer reply to own ticket ───────────────────────

    @Override
    public TicketResponse userReply(String ticketId, String userId,
                                     TicketReplyRequest req) {
        SupportTicket ticket = ticketRepo.findById(ticketId)
                .orElseThrow(() -> new ApiException("Ticket not found",
                        HttpStatus.NOT_FOUND, "TICKET_NOT_FOUND"));

        // Must be the ticket owner
        if (!ticket.getUserId().equals(userId))
            throw new ApiException(
                    "You can only reply to your own ticket",
                    HttpStatus.FORBIDDEN, "NOT_YOUR_TICKET");

        // Cannot reply to closed/resolved
        if (ticket.getStatus() == SupportTicket.TicketStatus.CLOSED
                || ticket.getStatus() == SupportTicket.TicketStatus.RESOLVED)
            throw new ApiException(
                    "Cannot reply to a " + ticket.getStatus() + " ticket",
                    HttpStatus.BAD_REQUEST, "TICKET_CLOSED");

        String userName = fetchUserName(userId);

        TicketReply reply = TicketReply.builder()
                .ticket(ticket)
                .repliedBy(userId)
                .repliedByName(userName)
                .senderType(TicketReply.SenderType.USER)
                .message(req.getMessage())
                .build();

        replyRepo.save(reply);
        ticket.getReplies().add(reply);

        // Status: if it was WAITING_USER, move back to IN_PROGRESS
        if (ticket.getStatus() == SupportTicket.TicketStatus.WAITING_USER
                || ticket.getStatus() == SupportTicket.TicketStatus.OPEN)
            ticket.setStatus(SupportTicket.TicketStatus.IN_PROGRESS);

        ticket.setUpdatedBy(userId);
        SupportTicket saved = ticketRepo.save(ticket);
        log.info("User {} replied to ticket {}", userId, ticketId);
        return TicketResponse.from(saved);
    }

    // ── Agent/Admin reply ──────────────────────────────────

    @Override
    public TicketResponse agentReply(String ticketId, String agentId,
                                      String role,
                                      TicketReplyRequest req) {
        SupportTicket ticket = ticketRepo.findById(ticketId)
                .orElseThrow(() -> new ApiException("Ticket not found",
                        HttpStatus.NOT_FOUND, "TICKET_NOT_FOUND"));

        // ── BUSINESS RULE: Conflict of interest check ─────
        // MANAGER who raised ticket CANNOT act as agent
        // ADMIN who raised ticket CAN act as agent (override)
        boolean isAdmin = isAdmin(role);
        boolean isTicketRaiser = ticket.getUserId().equals(agentId);

        if (isTicketRaiser && !isAdmin) {
            // MANAGER trying to resolve own ticket
            throw new ApiException(
                    "You raised this ticket and cannot resolve it yourself. "
                    + "A different admin or manager must handle it.",
                    HttpStatus.FORBIDDEN, "CONFLICT_OF_INTEREST");
        }
        
        // ADMIN can proceed even if they raised the ticket
        if (isTicketRaiser && isAdmin) {
            log.info("ADMIN {} is acting as agent on their own ticket {}",
                    agentId, ticketId);
        }
        // ──────────────────────────────────────────────────

        // Cannot reply to closed tickets
        if (ticket.getStatus() == SupportTicket.TicketStatus.CLOSED)
            throw new ApiException("Cannot reply to a CLOSED ticket",
                    HttpStatus.BAD_REQUEST, "TICKET_CLOSED");

        String agentName = fetchUserName(agentId);
        if (agentName == null || agentName.equals("User"))
            agentName = "Support Agent";

        TicketReply reply = TicketReply.builder()
                .ticket(ticket)
                .repliedBy(agentId)
                .repliedByName(agentName)
                .senderType(TicketReply.SenderType.AGENT)
                .message(req.getMessage())
                .build();

        replyRepo.save(reply);
        ticket.getReplies().add(reply);

        // Auto-assign to this agent if not yet assigned
        if (ticket.getAssignedTo() == null)
            ticket.setAssignedTo(agentId);

        // Status: waiting for customer response
        if (ticket.getStatus() != SupportTicket.TicketStatus.RESOLVED)
            ticket.setStatus(SupportTicket.TicketStatus.WAITING_USER);

        ticket.setUpdatedBy(agentId);
        SupportTicket saved = ticketRepo.save(ticket);
        log.info("Agent {} replied to ticket {}", agentId, ticketId);
        return TicketResponse.from(saved);
    }

    // ── Agent/Admin update ticket ──────────────────────────

    @Override
    public TicketResponse updateTicket(String ticketId, String agentId,
                                        String role,
                                        UpdateTicketRequest req) {
        SupportTicket ticket = ticketRepo.findById(ticketId)
                .orElseThrow(() -> new ApiException("Ticket not found",
                        HttpStatus.NOT_FOUND, "TICKET_NOT_FOUND"));

        // Same business rule: MANAGER cannot update own ticket, ADMIN can
        boolean isAdmin = isAdmin(role);
        boolean isTicketRaiser = ticket.getUserId().equals(agentId);

        if (isTicketRaiser && !isAdmin) {
            throw new ApiException(
                    "You raised this ticket and cannot update it yourself. "
                    + "A different admin or manager must handle it.",
                    HttpStatus.FORBIDDEN, "CONFLICT_OF_INTEREST");
        }

        if (isTicketRaiser && isAdmin) {
            log.info("ADMIN {} is updating their own ticket {}",
                    agentId, ticketId);
        }

        if (req.getStatus() != null) {
            ticket.setStatus(req.getStatus());
            if (req.getStatus() == SupportTicket.TicketStatus.RESOLVED)
                ticket.setResolvedAt(LocalDateTime.now());
            if (req.getStatus() == SupportTicket.TicketStatus.CLOSED)
                ticket.setClosedAt(LocalDateTime.now());
        }
        if (req.getPriority()       != null) ticket.setPriority(req.getPriority());
        if (req.getAssignedTo()     != null) ticket.setAssignedTo(req.getAssignedTo());
        if (req.getResolutionNote() != null)
            ticket.setResolutionNote(req.getResolutionNote());

        ticket.setUpdatedBy(agentId);
        SupportTicket saved = ticketRepo.save(ticket);
        log.info("Ticket {} updated by agentId: {}", ticketId, agentId);
        return TicketResponse.from(saved);
    }

    // ── User closes own ticket ─────────────────────────────

    @Override
    public TicketResponse closeTicket(String ticketId, String userId) {
        SupportTicket ticket = ticketRepo.findByIdAndUserId(ticketId, userId)
                .orElseThrow(() -> new ApiException(
                        "Ticket not found or not yours",
                        HttpStatus.NOT_FOUND, "TICKET_NOT_FOUND"));

        if (ticket.getStatus() == SupportTicket.TicketStatus.CLOSED)
            throw new ApiException("Ticket is already closed",
                    HttpStatus.BAD_REQUEST, "ALREADY_CLOSED");

        ticket.setStatus(SupportTicket.TicketStatus.CLOSED);
        ticket.setClosedAt(LocalDateTime.now());
        ticket.setUpdatedBy(userId);
        return TicketResponse.from(ticketRepo.save(ticket));
    }

    // ── Admin delete ───────────────────────────────────────

    @Override
    public void deleteTicket(String ticketId, String adminId) {
        SupportTicket ticket = ticketRepo.findById(ticketId)
                .orElseThrow(() -> new ApiException("Ticket not found",
                        HttpStatus.NOT_FOUND, "TICKET_NOT_FOUND"));
        ticketRepo.delete(ticket);
        log.info("Ticket {} deleted by admin: {}", ticketId, adminId);
    }

    // ── Helpers ────────────────────────────────────────────

    private void validateUserExists(String userId) {
        try {
            Boolean inAuth = authClient.userExists(userId);
            if (Boolean.FALSE.equals(inAuth))
                throw new ApiException("User not found in auth-service",
                        HttpStatus.NOT_FOUND, "USER_NOT_FOUND");
        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            log.warn("Auth check skipped: {}", e.getMessage());
        }

        try {
            Boolean inUser = userClient.userExists(userId);
            if (Boolean.FALSE.equals(inUser))
                throw new ApiException("User profile not found",
                        HttpStatus.NOT_FOUND, "USER_NOT_FOUND");
        } catch (ApiException e) {
            if ("USER_NOT_FOUND".equals(e.getErrorCode())) throw e;
            log.warn("User-service check skipped: {}", e.getMessage());
        } catch (Exception e) {
            log.warn("User-service check skipped: {}", e.getMessage());
        }
    }

    private void validateRestaurantExists(String restaurantId) {
        try {
            Map<String, Object> data =
                    restaurantClient.getRestaurant(restaurantId);
            if (data == null)
                throw new ApiException("Restaurant not found",
                        HttpStatus.NOT_FOUND, "RESTAURANT_NOT_FOUND");
        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            throw new ApiException("Restaurant not found",
                    HttpStatus.NOT_FOUND, "RESTAURANT_NOT_FOUND");
        }
    }

    private String fetchUserName(String userId) {
        try {
            Map<String, Object> response = userClient.getInternalProfile(userId);
            if (response != null && response.get("data") instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<String, Object> data = (Map<String, Object>) response.get("data");
                Object name = data.get("name");
                if (name != null && !name.toString().isBlank())
                    return name.toString();
            }
        } catch (Exception e) {
            log.warn("Could not fetch user name for {}: {}",
                    userId, e.getMessage());
        }
        return null;
    }

    private String fetchUserEmail(String userId) {
        try {
            Map<String, Object> response = userClient.getInternalProfile(userId);
            if (response != null && response.get("data") instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<String, Object> data = (Map<String, Object>) response.get("data");
                Object email = data.get("email");
                if (email != null) return email.toString();
            }
        } catch (Exception e) {
            log.warn("Could not fetch email for {}: {}", userId, e.getMessage());
        }
        return null;
    }

    private String generateTicketNumber() {
        int  year  = Year.now().getValue();
        long count = ticketRepo.countThisYear() + 1;
        return String.format("TKT-%d-%04d", year, count);
    }

    private SupportTicket.TicketStatus parseStatus(String status) {
        try {
            return SupportTicket.TicketStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ApiException(
                    "Invalid status: " + status
                    + ". Valid: OPEN, IN_PROGRESS, WAITING_USER, RESOLVED, CLOSED",
                    HttpStatus.BAD_REQUEST, "INVALID_STATUS");
        }
    }

    private boolean isAdminOrManager(String role) {
        if (role == null) return false;
        String r = role.toUpperCase();
        return r.contains("ADMIN") || r.contains("MANAGER");
    }

    private boolean isAdmin(String role) {
        return role != null && role.toUpperCase().contains("ADMIN");
    }
}
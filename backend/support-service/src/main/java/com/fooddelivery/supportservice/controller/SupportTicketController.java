package com.fooddelivery.supportservice.controller;

import com.fooddelivery.supportservice.dto.ApiResponse;
import com.fooddelivery.supportservice.dto.ticket.*;
import com.fooddelivery.supportservice.exception.ApiException;
import com.fooddelivery.supportservice.service.SupportTicketService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/support/tickets")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Support Tickets", description = "Customer support ticket management")
public class SupportTicketController {

    private final SupportTicketService ticketService;

    // ── USER: Create ticket ────────────────────────────────

    @PostMapping
    @Operation(summary = "Create support ticket")
    public ResponseEntity<ApiResponse<TicketResponse>> create(
            @RequestHeader("X-User-Id")   String userId,
            @RequestHeader("X-User-Role") String role,
            @Valid @RequestBody TicketRequest request) {
        // Anyone authenticated can raise a ticket
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Ticket created",
                        ticketService.createTicket(userId, request)));
    }

    // ── GET ticket by ID ───────────────────────────────────

    @GetMapping("/{ticketId}")
    @Operation(summary = "Get ticket — own ticket for users, any for admin/manager")
    public ResponseEntity<ApiResponse<TicketResponse>> getById(
            @PathVariable String ticketId,
            @RequestHeader("X-User-Id")   String userId,
            @RequestHeader("X-User-Role") String role) {
        return ResponseEntity.ok(ApiResponse.success(
                ticketService.getTicket(ticketId, userId, role)));
    }

    @GetMapping("/number/{ticketNumber}")
    @Operation(summary = "Get ticket by number")
    public ResponseEntity<ApiResponse<TicketResponse>> getByNumber(
            @PathVariable String ticketNumber,
            @RequestHeader("X-User-Id")   String userId,
            @RequestHeader("X-User-Role") String role) {
        return ResponseEntity.ok(ApiResponse.success(
                ticketService.getByTicketNumber(ticketNumber, userId, role)));
    }

    // ── USER: My tickets ───────────────────────────────────

    @GetMapping("/my-tickets")
    @Operation(summary = "Get my tickets")
    public ResponseEntity<ApiResponse<Page<TicketResponse>>> myTickets(
            @RequestHeader("X-User-Id") String userId,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success(
                ticketService.getMyTickets(userId, status, page, size)));
    }

    // ── USER: Reply to own ticket ──────────────────────────

    @PostMapping("/{ticketId}/reply")
    @Operation(summary = "User replies to their own ticket (as customer, not agent)")
    public ResponseEntity<ApiResponse<TicketResponse>> userReply(
            @PathVariable String ticketId,
            @RequestHeader("X-User-Id")   String userId,
            @RequestHeader("X-User-Role") String role,
            @Valid @RequestBody TicketReplyRequest request) {

        // Service layer validates ownership
        return ResponseEntity.ok(ApiResponse.success("Reply added",
                ticketService.userReply(ticketId, userId, request)));
    }

    // ── USER: Close own ticket ─────────────────────────────

    @PatchMapping("/{ticketId}/close")
    @Operation(summary = "User closes their own ticket")
    public ResponseEntity<ApiResponse<TicketResponse>> close(
            @PathVariable String ticketId,
            @RequestHeader("X-User-Id")   String userId,
            @RequestHeader("X-User-Role") String role) {

        // No role check - anyone can close their own ticket
        // Service layer validates ownership
        return ResponseEntity.ok(ApiResponse.success("Ticket closed",
                ticketService.closeTicket(ticketId, userId)));
    }

    // ── ADMIN/MANAGER: All tickets ─────────────────────────

    @GetMapping
    @Operation(summary = "Get all tickets — ADMIN/MANAGER only")
    public ResponseEntity<ApiResponse<Page<TicketResponse>>> allTickets(
            @RequestHeader("X-User-Id")   String userId,
            @RequestHeader("X-User-Role") String role,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {

        requireAdminOrManager(role);
        return ResponseEntity.ok(ApiResponse.success(
                ticketService.getAllTickets(status, page, size)));
    }

    // ── ADMIN/MANAGER: Agent reply ─────────────────────────

    @PostMapping("/{ticketId}/agent-reply")
    @Operation(summary = "Agent reply — ADMIN/MANAGER only")
    public ResponseEntity<ApiResponse<TicketResponse>> agentReply(
            @PathVariable String ticketId,
            @RequestHeader("X-User-Id")   String agentId,
            @RequestHeader("X-User-Role") String role,
            @Valid @RequestBody TicketReplyRequest request) {

        requireAdminOrManager(role);
        return ResponseEntity.ok(ApiResponse.success("Agent reply added",
                ticketService.agentReply(ticketId, agentId, role, request)));
    }

    // ── ADMIN/MANAGER: Update ticket ───────────────────────

    @PatchMapping("/{ticketId}")
    @Operation(summary = "Update status/priority/resolution — ADMIN/MANAGER only")
    public ResponseEntity<ApiResponse<TicketResponse>> update(
            @PathVariable String ticketId,
            @RequestHeader("X-User-Id")   String agentId,
            @RequestHeader("X-User-Role") String role,
            @RequestBody UpdateTicketRequest request) {

        requireAdminOrManager(role);
        return ResponseEntity.ok(ApiResponse.success("Ticket updated",
                ticketService.updateTicket(ticketId, agentId, role, request)));
    }

    // ── ADMIN only: Delete ─────────────────────────────────

    @DeleteMapping("/{ticketId}")
    @Operation(summary = "Delete ticket — ADMIN only")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable String ticketId,
            @RequestHeader("X-User-Id")   String adminId,
            @RequestHeader("X-User-Role") String role) {

        requireAdmin(role);
        ticketService.deleteTicket(ticketId, adminId);
        return ResponseEntity.ok(ApiResponse.success("Ticket deleted", null));
    }

    // ── Role helpers ───────────────────────────────────────

    private boolean isAdminOrManager(String role) {
        if (role == null) return false;
        String r = role.toUpperCase();
        return r.contains("ADMIN") || r.contains("MANAGER");
    }

    private void requireAdminOrManager(String role) {
        if (!isAdminOrManager(role))
            throw new ApiException(
                    "Only ADMIN or MANAGER can perform this action",
                    HttpStatus.FORBIDDEN, "INSUFFICIENT_ROLE");
    }

    private void requireAdmin(String role) {
        if (role == null || !role.toUpperCase().contains("ADMIN"))
            throw new ApiException("Only ADMIN can perform this action",
                    HttpStatus.FORBIDDEN, "ADMIN_ONLY");
    }
}
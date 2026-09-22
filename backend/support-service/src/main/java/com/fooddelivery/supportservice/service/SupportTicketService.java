package com.fooddelivery.supportservice.service;

import com.fooddelivery.supportservice.dto.ticket.*;
import org.springframework.data.domain.Page;

public interface SupportTicketService {

    TicketResponse createTicket(String userId, TicketRequest request);

    TicketResponse getTicket(String ticketId, String requesterId, String role);

    TicketResponse getByTicketNumber(String ticketNumber,
                                      String requesterId, String role);

    Page<TicketResponse> getMyTickets(String userId, String status,
                                       int page, int size);

    Page<TicketResponse> getAllTickets(String status, int page, int size);

    // Customer replying to own ticket
    TicketResponse userReply(String ticketId, String userId,
                               TicketReplyRequest request);

    // Agent/Admin replying — validates not same as ticket raiser (unless ADMIN)
    TicketResponse agentReply(String ticketId, String agentId,
                                String role, TicketReplyRequest request);

    // Agent/Admin updates ticket
    TicketResponse updateTicket(String ticketId, String agentId,
                                  String role, UpdateTicketRequest request);

    // User closes own ticket
    TicketResponse closeTicket(String ticketId, String userId);

    void deleteTicket(String ticketId, String adminId);
}
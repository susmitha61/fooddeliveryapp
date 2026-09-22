package com.fooddelivery.supportservice.dto.ticket;

import com.fooddelivery.supportservice.entity.SupportTicket;
import lombok.Data;

@Data
public class UpdateTicketRequest {

    private SupportTicket.TicketStatus status;
    private SupportTicket.Priority     priority;
    private String assignedTo;
    private String resolutionNote;
}
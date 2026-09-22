package com.fooddelivery.supportservice.dto.ticket;

import com.fooddelivery.supportservice.entity.SupportTicket;
import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class TicketRequest {

    @NotNull(message = "Category is required")
    private SupportTicket.TicketCategory category;

    // Optional — provide if issue is order-related
    private String orderId;

    // Optional — provide if issue is restaurant-related
    private String restaurantId;

    @NotBlank(message = "Subject is required")
    @Size(min = 5, max = 200, message = "Subject must be 5–200 characters")
    private String subject;

    @NotBlank(message = "Description is required")
    @Size(min = 10, max = 2000, message = "Description must be 10–2000 characters")
    private String description;
}
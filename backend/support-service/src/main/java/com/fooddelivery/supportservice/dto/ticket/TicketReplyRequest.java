package com.fooddelivery.supportservice.dto.ticket;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class TicketReplyRequest {

    @NotBlank(message = "Message is required")
    @Size(min = 2, max = 2000, message = "Message must be 2–2000 characters")
    private String message;
}
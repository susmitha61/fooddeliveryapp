package com.fooddelivery.paymentservice.dto;

import com.fooddelivery.paymentservice.entity.Payment;
import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class InitiatePaymentRequest {

    @NotBlank(message = "Order ID is required")
    private String orderId;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be greater than 0")
    private Double amount;

    @NotNull(message = "Payment method is required")
    private Payment.PaymentMethod paymentMethod;

    // For UPI payments
    private String upiId;

    // For card payments
    private String cardLastFour;
    private String cardNetwork;  // VISA, MASTERCARD etc.
}
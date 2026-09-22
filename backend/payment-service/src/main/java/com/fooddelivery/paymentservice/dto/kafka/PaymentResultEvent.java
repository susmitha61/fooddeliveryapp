package com.fooddelivery.paymentservice.dto.kafka;

import lombok.*;

@Data @Builder
@NoArgsConstructor @AllArgsConstructor
public class PaymentResultEvent {
    private String paymentId;
    private String orderId;
    private String userId;
    private String restaurantId;
    private Double amount;
    private String status;         // SUCCESS or FAILED
    private String paymentMethod;
    private String failureReason;
    private String transactionRef;
}
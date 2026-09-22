package com.fooddelivery.orderservice.dto.kafka;

import lombok.*;

@Data @Builder
@NoArgsConstructor @AllArgsConstructor
public class PaymentResultEvent {
    private String orderId;
    private String paymentId;
    private String status;       // SUCCESS or FAILED
    private String failureReason;
    private Double amount;
}
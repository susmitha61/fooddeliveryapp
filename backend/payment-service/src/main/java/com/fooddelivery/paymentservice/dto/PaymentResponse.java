package com.fooddelivery.paymentservice.dto;

import com.fooddelivery.paymentservice.entity.Payment;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;
import java.time.LocalDateTime;

@Data @Builder
@NoArgsConstructor @AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PaymentResponse {

    private String paymentId;
    private String orderId;
    private String userId;
    private Double amount;
    private String paymentMethod;
    private String status;
    private String transactionRef;
    private String failureReason;
    private String refundId;
    private Double refundedAmount;
    private LocalDateTime refundedAt;
    private LocalDateTime paidAt;
    private String updatedBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static PaymentResponse from(Payment p) {
        return PaymentResponse.builder()
                .paymentId(p.getId())
                .orderId(p.getOrderId())
                .userId(p.getUserId())
                .amount(p.getAmount())
                .paymentMethod(p.getPaymentMethod().name())
                .status(p.getStatus().name())
                .transactionRef(p.getTransactionRef())
                .failureReason(p.getFailureReason())
                .refundId(p.getRefundId())
                .refundedAmount(p.getRefundedAmount())
                .refundedAt(p.getRefundedAt())
                .paidAt(p.getPaidAt())
                .updatedBy(p.getUpdatedBy())
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }
}
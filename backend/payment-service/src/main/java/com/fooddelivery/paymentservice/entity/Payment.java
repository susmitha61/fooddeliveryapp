package com.fooddelivery.paymentservice.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "payments", indexes = {
    @Index(name = "idx_pay_order",  columnList = "orderId"),
    @Index(name = "idx_pay_user",   columnList = "userId"),
    @Index(name = "idx_pay_status", columnList = "status")
})
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Payment {

    @Id
    @Column(name = "payment_id", length = 36)
    @Builder.Default
    private String id = UUID.randomUUID().toString();

    // Links
    @Column(name = "order_id", nullable = false, length = 36)
    private String orderId;

    @Column(name = "user_id", nullable = false, length = 36)
    private String userId;

    @Column(name = "restaurant_id", length = 36)
    private String restaurantId;

    // Amount
    @Column(name = "amount", nullable = false)
    private Double amount;

    // Payment method
    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false, length = 30)
    private PaymentMethod paymentMethod;

    // Status
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private PaymentStatus status = PaymentStatus.PENDING;

    // For online payments — transaction reference
    @Column(name = "transaction_ref", length = 100)
    private String transactionRef;

    // Failure reason if failed
    @Column(name = "failure_reason", length = 300)
    private String failureReason;

    // Refund info
    @Column(name = "refund_id", length = 100)
    private String refundId;

    @Column(name = "refunded_amount")
    private Double refundedAmount;

    @Column(name = "refunded_at")
    private LocalDateTime refundedAt;

    // Audit
    @Column(name = "updated_by", length = 36)
    private String updatedBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    // ── Enums ──────────────────────────────────────────────
    public enum PaymentMethod {
        CASH_ON_DELIVERY,
        UPI,
        CARD,
        NET_BANKING,
        WALLET
    }

    public enum PaymentStatus {
        PENDING,      // initiated, not yet processed
        SUCCESS,      // payment confirmed
        FAILED,       // payment failed
        REFUNDED,     // refund processed
        CANCELLED     // cancelled before processing
    }
}
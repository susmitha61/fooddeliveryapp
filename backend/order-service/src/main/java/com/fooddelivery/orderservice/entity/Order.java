package com.fooddelivery.orderservice.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;
import java.util.*;

@Entity
@Table(name = "orders", indexes = {
    @Index(name = "idx_order_user",       columnList = "user_id"),
    @Index(name = "idx_order_restaurant", columnList = "restaurant_id"),
    @Index(name = "idx_order_status",     columnList = "status")
})
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Order {

    @Id
    @Column(name = "order_id", length = 36)
    @Builder.Default
    private String id = UUID.randomUUID().toString();

    @Column(name = "user_id", nullable = false, length = 36)
    private String userId;

    @Column(name = "restaurant_id", nullable = false, length = 36)
    private String restaurantId;

    @Column(name = "restaurant_name", nullable = false, length = 150)
    private String restaurantName;

    // Delivery address snapshot
    @Column(name = "delivery_address", nullable = false, length = 500)
    private String deliveryAddress;

    @Column(name = "delivery_area", length = 100)
    private String deliveryArea;

    @Column(name = "delivery_city", length = 100)
    private String deliveryCity;

    @Column(name = "delivery_pincode", length = 10)
    private String deliveryPincode;

    // Financials
    @Column(name = "subtotal", nullable = false)
    private Double subtotal;

    @Column(name = "delivery_fee", nullable = false)
    @Builder.Default
    private Double deliveryFee = 0.0;

    @Column(name = "total_amount", nullable = false)
    private Double totalAmount;

    // Payment
    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false, length = 30)
    private PaymentMethod paymentMethod;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", nullable = false, length = 30)
    @Builder.Default
    private PaymentStatus paymentStatus = PaymentStatus.PENDING;

    @Column(name = "payment_id", length = 100)
    private String paymentId;

    // Status
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private OrderStatus status = OrderStatus.PLACED;

    @Column(name = "cancellation_reason", length = 300)
    private String cancellationReason;

    @Column(name = "special_instructions", length = 500)
    private String specialInstructions;

    // Audit
    @Column(name = "updated_by", length = 36)
    private String updatedBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "confirmed_at")
    private LocalDateTime confirmedAt;

    @Column(name = "delivered_at")
    private LocalDateTime deliveredAt;

    @OneToMany(mappedBy = "order",
               cascade = CascadeType.ALL,
               fetch = FetchType.EAGER)
    @Builder.Default
    private List<OrderItem> items = new ArrayList<>();

    public enum OrderStatus {
        PLACED,
        PENDING_PAYMENT,
        PAYMENT_FAILED,
        CONFIRMED,
        PREPARING,
        READY_FOR_PICKUP,
        OUT_FOR_DELIVERY,
        DELIVERED,
        CANCELLED
    }

    public enum PaymentMethod {
        CASH_ON_DELIVERY, UPI, CARD, NET_BANKING, WALLET
    }

    public enum PaymentStatus {
        PENDING, PAID, FAILED, REFUNDED
    }
}
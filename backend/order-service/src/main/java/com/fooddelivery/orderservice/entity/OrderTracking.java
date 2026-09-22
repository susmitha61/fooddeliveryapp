package com.fooddelivery.orderservice.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "order_tracking")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class OrderTracking {

    @Id
    @Column(name = "tracking_id", length = 36)
    @Builder.Default
    private String id = UUID.randomUUID().toString();

    // Simple String FK — no OneToOne conflict
    @Column(name = "order_id", nullable = false, unique = true, length = 36)
    private String orderId;

    @Column(name = "user_id", nullable = false, length = 36)
    private String userId;

    @Column(name = "restaurant_id", length = 36)
    private String restaurantId;

    // Driver info
    @Column(name = "driver_name", length = 100)
    private String driverName;

    @Column(name = "driver_phone", length = 20)
    private String driverPhone;

    @Column(name = "driver_vehicle_number", length = 20)
    private String driverVehicleNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private TrackingStatus status = TrackingStatus.ORDER_PLACED;

    @Column(name = "status_message", length = 300)
    private String statusMessage;

    // Timestamps per status
    @Column(name = "placed_at")
    private LocalDateTime placedAt;

    @Column(name = "confirmed_at")
    private LocalDateTime confirmedAt;

    @Column(name = "preparing_at")
    private LocalDateTime preparingAt;

    @Column(name = "ready_at")
    private LocalDateTime readyAt;

    @Column(name = "picked_up_at")
    private LocalDateTime pickedUpAt;

    @Column(name = "delivered_at")
    private LocalDateTime deliveredAt;

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    @Column(name = "estimated_delivery_time")
    private LocalDateTime estimatedDeliveryTime;

    @Column(name = "actual_delivery_time")
    private LocalDateTime actualDeliveryTime;

    @Column(name = "updated_by", length = 36)
    private String updatedBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum TrackingStatus {
        ORDER_PLACED,
        ORDER_CONFIRMED,
        PREPARING,
        READY_FOR_PICKUP,
        DRIVER_ASSIGNED,
        OUT_FOR_DELIVERY,
        DELIVERED,
        CANCELLED
    }
}
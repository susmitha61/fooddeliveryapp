package com.fooddelivery.orderservice.dto.tracking;

import com.fooddelivery.orderservice.entity.OrderTracking;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;
import java.time.LocalDateTime;

@Data @Builder
@NoArgsConstructor @AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class TrackingResponse {

    private String trackingId;
    private String orderId;
    private String userId;
    private String status;
    private String statusMessage;
    private String driverName;
    private String driverPhone;
    private String driverVehicleNumber;
    private LocalDateTime placedAt;
    private LocalDateTime confirmedAt;
    private LocalDateTime preparingAt;
    private LocalDateTime readyAt;
    private LocalDateTime pickedUpAt;
    private LocalDateTime deliveredAt;
    private LocalDateTime cancelledAt;
    private LocalDateTime estimatedDeliveryTime;
    private LocalDateTime actualDeliveryTime;
    private String updatedBy;
    private LocalDateTime updatedAt;

    public static TrackingResponse from(OrderTracking t) {
        return TrackingResponse.builder()
                .trackingId(t.getId())
                .orderId(t.getOrderId())
                .userId(t.getUserId())
                .status(t.getStatus().name())
                .statusMessage(t.getStatusMessage())
                .driverName(t.getDriverName())
                .driverPhone(t.getDriverPhone())
                .driverVehicleNumber(t.getDriverVehicleNumber())
                .placedAt(t.getPlacedAt())
                .confirmedAt(t.getConfirmedAt())
                .preparingAt(t.getPreparingAt())
                .readyAt(t.getReadyAt())
                .pickedUpAt(t.getPickedUpAt())
                .deliveredAt(t.getDeliveredAt())
                .cancelledAt(t.getCancelledAt())
                .estimatedDeliveryTime(t.getEstimatedDeliveryTime())
                .actualDeliveryTime(t.getActualDeliveryTime())
                .updatedBy(t.getUpdatedBy())
                .updatedAt(t.getUpdatedAt())
                .build();
    }
}
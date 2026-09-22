package com.fooddelivery.orderservice.dto.order;

import com.fooddelivery.orderservice.entity.Order;
import com.fooddelivery.orderservice.entity.OrderItem;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Data @Builder
@NoArgsConstructor @AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class OrderResponse {

    private String orderId;
    private String userId;
    private String restaurantId;
    private String restaurantName;
    private String deliveryAddress;
    private String deliveryArea;
    private String deliveryCity;
    private String deliveryPincode;
    private Double subtotal;
    private Double deliveryFee;
    private Double totalAmount;
    private String status;
    private String paymentMethod;
    private String paymentStatus;
    private String paymentId;
    private String cancellationReason;
    private String specialInstructions;
    private String updatedBy;
    private String driverName;
    private String driverPhone;
    private String driverVehicleNumber;
    private List<OrderItemResponse> items;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime confirmedAt;
    private LocalDateTime deliveredAt;

    public static OrderResponse from(Order o) {
        return OrderResponse.builder()
                .orderId(o.getId())
                .userId(o.getUserId())
                .restaurantId(o.getRestaurantId())
                .restaurantName(o.getRestaurantName())
                .deliveryAddress(o.getDeliveryAddress())
                .deliveryArea(o.getDeliveryArea())
                .deliveryCity(o.getDeliveryCity())
                .deliveryPincode(o.getDeliveryPincode())
                .subtotal(o.getSubtotal())
                .deliveryFee(o.getDeliveryFee())
                .totalAmount(o.getTotalAmount())
                .status(o.getStatus().name())
                .paymentMethod(o.getPaymentMethod().name())
                .paymentStatus(o.getPaymentStatus().name())
                .paymentId(o.getPaymentId())
                .cancellationReason(o.getCancellationReason())
                .specialInstructions(o.getSpecialInstructions())
                .updatedBy(o.getUpdatedBy())
                .items(o.getItems() == null ? List.of() :
                        o.getItems().stream()
                                .map(OrderItemResponse::from)
                                .collect(Collectors.toList()))
                .createdAt(o.getCreatedAt())
                .updatedAt(o.getUpdatedAt())
                .confirmedAt(o.getConfirmedAt())
                .deliveredAt(o.getDeliveredAt())
                .build();
    }
}
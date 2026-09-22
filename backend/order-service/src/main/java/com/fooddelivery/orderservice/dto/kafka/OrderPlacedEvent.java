package com.fooddelivery.orderservice.dto.kafka;

import lombok.*;
import java.util.List;

@Data @Builder
@NoArgsConstructor @AllArgsConstructor
public class OrderPlacedEvent {
    private String orderId;
    private String userId;
    private String restaurantId;
    private String restaurantName;
    private Double totalAmount;
    private String paymentMethod;
    private List<String> itemIds;
}
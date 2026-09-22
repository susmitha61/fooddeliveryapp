package com.fooddelivery.orderservice.dto.order;

import com.fooddelivery.orderservice.entity.OrderItem;
import lombok.*;

@Data @Builder
@NoArgsConstructor @AllArgsConstructor
public class OrderItemResponse {
    private String orderItemId;
    private String itemId;
    private String itemName;
    private Double price;
    private Integer quantity;
    private Double itemTotal;
    private Boolean isVegetarian;
    private String imageUrl;

    public static OrderItemResponse from(OrderItem i) {
        return OrderItemResponse.builder()
                .orderItemId(i.getId())
                .itemId(i.getItemId())
                .itemName(i.getItemName())
                .price(i.getPrice())
                .quantity(i.getQuantity())
                .itemTotal(i.getItemTotal())
                .isVegetarian(i.getIsVegetarian())
                .imageUrl(i.getImageUrl())
                .build();
    }
}
package com.fooddelivery.orderservice.dto.cart;

import com.fooddelivery.orderservice.entity.CartItem;
import lombok.*;

@Data @Builder
@NoArgsConstructor @AllArgsConstructor
public class CartItemResponse {
    private String cartItemId;
    private String itemId;
    private String itemName;
    private Double price;
    private Integer quantity;
    private Double itemTotal;
    private Boolean isVegetarian;
    private Boolean isAvailable;
    private String imageUrl;
    private String unavailableReason;

    public static CartItemResponse from(CartItem i) {
        return CartItemResponse.builder()
                .cartItemId(i.getId())
                .itemId(i.getItemId())
                .itemName(i.getItemName())
                .price(i.getPrice())
                .quantity(i.getQuantity())
                .itemTotal(i.getPrice() * i.getQuantity())
                .isVegetarian(i.getIsVegetarian())
                .isAvailable(i.getIsAvailable())
                .imageUrl(i.getImageUrl())
                .unavailableReason(i.getUnavailableReason())
                .build();
    }
}
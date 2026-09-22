package com.fooddelivery.orderservice.dto.cart;

import com.fooddelivery.orderservice.entity.Cart;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Data @Builder
@NoArgsConstructor @AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class CartResponse {

    private String cartId;
    private String userId;
    private String restaurantId;
    private String restaurantName;
    private List<CartItemResponse> items;
    private Integer totalItems;
    private Double subtotal;
    private Double deliveryFee;
    private Double total;
    private Boolean hasUnavailableItems;
    private LocalDateTime updatedAt;

    public static CartResponse from(Cart cart) {
        if (cart.getItems() == null || cart.getItems().isEmpty()) {
            return CartResponse.builder()
                    .cartId(cart.getId())
                    .userId(cart.getUserId())
                    .items(List.of())
                    .totalItems(0)
                    .subtotal(0.0)
                    .deliveryFee(0.0)
                    .total(0.0)
                    .hasUnavailableItems(false)
                    .updatedAt(cart.getUpdatedAt())
                    .build();
        }

        List<CartItemResponse> itemResponses = cart.getItems().stream()
                .map(CartItemResponse::from)
                .collect(Collectors.toList());

        double subtotal = cart.getSubtotal();
        double deliveryFee = cart.getDeliveryFee() != null
                ? cart.getDeliveryFee() : 0.0;
        boolean hasUnavailable = itemResponses.stream()
                .anyMatch(i -> Boolean.FALSE.equals(i.getIsAvailable()));

        return CartResponse.builder()
                .cartId(cart.getId())
                .userId(cart.getUserId())
                .restaurantId(cart.getRestaurantId())
                .restaurantName(cart.getRestaurantName())
                .items(itemResponses)
                .totalItems(cart.getTotalItems())
                .subtotal(subtotal)
                .deliveryFee(deliveryFee)
                .total(cart.getTotal())
                .hasUnavailableItems(hasUnavailable)
                .updatedAt(cart.getUpdatedAt())
                .build();
    }
}
package com.fooddelivery.orderservice.dto.cart;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class AddToCartRequest {

    @NotBlank private String restaurantId;
    @NotBlank private String restaurantName;
    @NotBlank private String itemId;
    @NotBlank private String itemName;

    @NotNull @DecimalMin("0.01")
    private Double price;

    @NotNull @Min(1)
    private Integer quantity;

    private Boolean isVegetarian;
    private String imageUrl;
    private Double deliveryFee;
}
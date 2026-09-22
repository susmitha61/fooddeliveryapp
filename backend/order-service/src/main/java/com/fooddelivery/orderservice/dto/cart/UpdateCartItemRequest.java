package com.fooddelivery.orderservice.dto.cart;

import jakarta.validation.constraints.Min;
import lombok.Data;

@Data
public class UpdateCartItemRequest {
    @Min(0)
    private int quantity;
}
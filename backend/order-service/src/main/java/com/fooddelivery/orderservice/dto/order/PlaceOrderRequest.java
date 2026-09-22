package com.fooddelivery.orderservice.dto.order;

import com.fooddelivery.orderservice.entity.Order;
import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class PlaceOrderRequest {

    @NotBlank(message = "Delivery address is required")
    private String deliveryAddress;

    private String deliveryArea;

    @NotBlank(message = "Delivery city is required")
    private String deliveryCity;

    @NotBlank(message = "Pincode is required")
    @Pattern(regexp = "^[1-9][0-9]{5}$", message = "Invalid pincode")
    private String deliveryPincode;

    @NotNull(message = "Payment method is required")
    private Order.PaymentMethod paymentMethod;

    private String specialInstructions;
}
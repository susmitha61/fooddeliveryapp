package com.fooddelivery.userservice.dto;

import java.util.UUID;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class FavouriteRequest {

    @NotNull(message = "Restaurant ID is required")
    private String restaurantId;

    @NotBlank(message = "Restaurant name is required")
    private String restaurantName;

    private String restaurantCuisine;
}
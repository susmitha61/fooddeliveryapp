package com.fooddelivery.restaurantservice.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class MenuItemRequest {

    @NotBlank(message = "Item name is required")
    @Size(min = 2, max = 150)
    private String name;

    @Size(max = 500)
    private String description;

    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.01", message = "Price must be greater than 0")
    private Double price;

    private String imageUrl;

    private Boolean isVegetarian = false;
    private Boolean isVegan      = false;
    private Boolean isSpicy      = false;

    // BREAKFAST, LUNCH, DINNER, SNACKS, ALL_DAY
    private String mealType = "ALL_DAY";

    private Boolean isAvailable     = true;
    private Boolean isTodaysSpecial = false;
    private Boolean isBestSeller    = false;

    private Integer preparationTimeMinutes = 15;
    private String  allergenInfo;
    private Integer calories;

    private String categoryId;
}
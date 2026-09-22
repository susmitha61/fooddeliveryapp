package com.fooddelivery.restaurantservice.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class MenuCategoryRequest {

    @NotBlank(message = "Category name is required")
    @Size(min = 2, max = 100)
    private String name;

    @Size(max = 300)
    private String description;

    private Integer displayOrder = 0;
}
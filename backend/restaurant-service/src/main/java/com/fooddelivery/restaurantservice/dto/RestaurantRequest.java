package com.fooddelivery.restaurantservice.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.util.Set;

@Data
public class RestaurantRequest {

    @NotBlank(message = "Name is required")
    @Size(min = 2, max = 150)
    private String name;

    @Size(max = 500)
    private String description;

    @NotBlank(message = "Cuisine type is required")
    private String cuisineType;

    // BREAKFAST, LUNCH, DINNER, SNACKS, ALL_DAY
    private Set<String> mealTypes;

    @NotBlank(message = "Street address is required")
    private String streetAddress;

    @NotBlank(message = "Area is required")
    private String area;

    @NotBlank(message = "City is required")
    private String city;

    @NotBlank(message = "State is required")
    private String state;

    @NotBlank(message = "Pincode is required")
    @Pattern(regexp = "^[1-9][0-9]{5}$", message = "Invalid pincode")
    private String pincode;

    @NotBlank(message = "Phone is required")
    @Pattern(regexp = "^[6-9]\\d{9}$", message = "Invalid phone")
    private String phone;

    private String email;

    private String openingTime;    // "09:00"
    private String closingTime;    // "22:00"

    @Min(0) private Double deliveryFee;
    @Min(0) private Double minimumOrderAmount;

    private Boolean isPureVeg = false;
    private String imageUrl;
}
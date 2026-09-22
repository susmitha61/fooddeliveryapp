package com.fooddelivery.restaurantservice.dto;

import lombok.Data;

@Data
public class RestaurantFilterRequest {

    // Location filters
    private String city;
    private String area;
    private String pincode;

    // Type filters
    private String cuisineType;
    private String mealType;      // BREAKFAST, LUNCH, DINNER, SNACKS
    private Boolean isPureVeg;
    private Boolean isOpen;

    // Quality filters
    private Double minRating;     // e.g. 3.5

    // Search
    private String keyword;       // searches name + cuisine + area

    // Sort
    private String sortBy;
    // RATING, DELIVERY_TIME, MIN_ORDER, NEWEST

    // Pagination
    private int page = 0;
    private int size = 10;
}
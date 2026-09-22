package com.fooddelivery.restaurantservice.dto;

import com.fooddelivery.restaurantservice.entity.Restaurant;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Set;

@Data @Builder
@NoArgsConstructor @AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class RestaurantResponse {

    private String id;
    private String ownerId;
    private Set<String> managerIds;
    private String name;
    private String description;
    private String cuisineType;
    private Set<String> mealTypes;

    // Location
    private String streetAddress;
    private String area;
    private String city;
    private String state;
    private String pincode;

    // Contact
    private String phone;
    private String email;

    // Status
    private Boolean isActive;
    private Boolean isOpen;
    private Boolean isCurrentlyOpen;
    private LocalTime openingTime;
    private LocalTime closingTime;
    private String status;

    // Delivery
    private Integer avgDeliveryMinutes;
    private Double deliveryFee;
    private Double minimumOrderAmount;

    // Rating
    private Double rating;
    private Integer totalRatings;

    // Flags
    private Boolean isPureVeg;
    private Boolean hasTodaysSpecial;
    private String imageUrl;

    private LocalDateTime createdAt;

    public static RestaurantResponse from(Restaurant r) {
        return RestaurantResponse.builder()
                .id(r.getId())
                .ownerId(r.getOwnerId())
                .managerIds(r.getManagerIds() != null ? r.getManagerIds() : Set.of())
                .name(r.getName())
                .description(r.getDescription())
                .cuisineType(r.getCuisineType())
                .mealTypes(r.getMealTypes())
                .streetAddress(r.getStreetAddress())
                .area(r.getArea())
                .city(r.getCity())
                .state(r.getState())
                .pincode(r.getPincode())
                .phone(r.getPhone())
                .email(r.getEmail())
                .isActive(r.getIsActive())
                .isOpen(r.getIsOpen())
                .isCurrentlyOpen(r.isCurrentlyOpen())
                .openingTime(r.getOpeningTime())
                .closingTime(r.getClosingTime())
                .status(r.getStatus().name())
                .avgDeliveryMinutes(r.getAvgDeliveryMinutes())
                .deliveryFee(r.getDeliveryFee())
                .minimumOrderAmount(r.getMinimumOrderAmount())
                .rating(r.getRating())
                .totalRatings(r.getTotalRatings())
                .isPureVeg(r.getIsPureVeg())
                .hasTodaysSpecial(r.getHasTodaysSpecial())
                .imageUrl(r.getImageUrl())
                .createdAt(r.getCreatedAt())
                .build();
    }
}
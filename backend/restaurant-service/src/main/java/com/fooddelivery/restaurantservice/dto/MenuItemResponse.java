package com.fooddelivery.restaurantservice.dto;

import com.fooddelivery.restaurantservice.entity.MenuItem;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

@Data @Builder
@NoArgsConstructor @AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class MenuItemResponse {

    private String  id;
    private String  restaurantId;
    private String  categoryId;
    private String  categoryName;
    private String  name;
    private String  description;
    private Double  price;
    private String  imageUrl;

    // Dietary
    private Boolean isVegetarian;
    private Boolean isVegan;
    private Boolean isSpicy;

    // Meal type
    private String  mealType;

    // Availability & special flags
    private Boolean isAvailable;
    private Boolean isTodaysSpecial;
    private Boolean isBestSeller;
    private Integer orderCount;

    // Rating
    private Double  rating;
    private Integer totalRatings;

    // Details
    private Integer preparationTimeMinutes;
    private String  allergenInfo;
    private Integer calories;

    public static MenuItemResponse from(MenuItem item) {
        return MenuItemResponse.builder()
                .id(item.getId())
                .restaurantId(item.getRestaurant().getId())
                .categoryId(item.getCategory() != null
                        ? item.getCategory().getId() : null)
                .categoryName(item.getCategory() != null
                        ? item.getCategory().getName() : null)
                .name(item.getName())
                .description(item.getDescription())
                .price(item.getPrice())
                .imageUrl(item.getImageUrl())
                .isVegetarian(item.getIsVegetarian())
                .isVegan(item.getIsVegan())
                .isSpicy(item.getIsSpicy())
                .mealType(item.getMealType())
                .isAvailable(item.getIsAvailable())
                .isTodaysSpecial(item.getIsTodaysSpecial())
                .isBestSeller(item.getIsBestSeller())
                .orderCount(item.getOrderCount())
                .rating(item.getRating())
                .totalRatings(item.getTotalRatings())
                .preparationTimeMinutes(item.getPreparationTimeMinutes())
                .allergenInfo(item.getAllergenInfo())
                .calories(item.getCalories())
                .build();
    }
}
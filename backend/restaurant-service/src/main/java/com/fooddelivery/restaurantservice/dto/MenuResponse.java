package com.fooddelivery.restaurantservice.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;
import java.util.List;

@Data @Builder
@NoArgsConstructor @AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class MenuResponse {
    private String restaurantId;
    private String restaurantName;
    private Boolean isPureVeg;
    private List<MenuCategoryResponse> categories;
    private List<MenuItemResponse> bestSellers;
    private List<MenuItemResponse> todaysSpecials;
}
package com.fooddelivery.supportservice.client;

import com.fooddelivery.supportservice.config.FeignConfig;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@FeignClient(name = "restaurant-service", configuration = FeignConfig.class)
public interface RestaurantServiceClient {

    // Validate restaurant exists
    @GetMapping("/api/v1/restaurants/{restaurantId}")
    Map<String, Object> getRestaurant(
            @PathVariable("restaurantId") String restaurantId);

    // Validate menu item exists and belongs to restaurant
    @GetMapping("/api/v1/menus/{restaurantId}/items/{itemId}")
    Map<String, Object> getMenuItem(
            @PathVariable("restaurantId") String restaurantId,
            @PathVariable("itemId") String itemId);

    // Push updated restaurant rating
    @PatchMapping("/api/v1/restaurants/internal/{restaurantId}/rating")
    void updateRestaurantRating(
            @PathVariable("restaurantId") String restaurantId,
            @RequestParam("rating") double rating);

    // Push updated menu item rating
    @PatchMapping("/api/v1/menus/internal/items/{itemId}/rating")
    void updateMenuItemRating(
            @PathVariable("itemId") String itemId,
            @RequestParam("rating") double rating);
}
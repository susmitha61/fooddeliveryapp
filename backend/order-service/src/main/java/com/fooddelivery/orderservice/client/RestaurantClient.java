package com.fooddelivery.orderservice.client;

import com.fooddelivery.orderservice.config.FeignConfig;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@FeignClient(name = "restaurant-service", configuration = FeignConfig.class)
public interface RestaurantClient {

    @GetMapping("/api/v1/restaurants/{restaurantId}")
    Map<String, Object> getRestaurant(
            @PathVariable("restaurantId") String restaurantId);

    @GetMapping("/api/v1/menus/{restaurantId}/items/{itemId}")
    Map<String, Object> getMenuItem(
            @PathVariable("restaurantId") String restaurantId,
            @PathVariable("itemId") String itemId);

    // Note: this is a PATCH not POST
    @PatchMapping("/api/v1/menus/internal/items/{itemId}/increment-order")
    void incrementOrderCount(@PathVariable("itemId") String itemId);
}
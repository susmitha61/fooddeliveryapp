package com.fooddelivery.restaurantservice.controller;

import com.fooddelivery.restaurantservice.dto.*;
import com.fooddelivery.restaurantservice.service.MenuService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/menus")
@RequiredArgsConstructor
@Tag(name = "Menu", description = "BRD Use Case 3 — View & Manage Menu")
public class MenuController {

    private final MenuService menuService;

    @GetMapping("/{restaurantId}")
    @Operation(summary = "Get full structured menu (UC3)")
    public ResponseEntity<ApiResponse<MenuResponse>> getFullMenu(
            @PathVariable String restaurantId) {
        return ResponseEntity.ok(ApiResponse.success(
                menuService.getFullMenu(restaurantId)));
    }

    @GetMapping("/{restaurantId}/categories")
    @Operation(summary = "Get menu categories")
    public ResponseEntity<ApiResponse<List<MenuCategoryResponse>>> getCategories(
            @PathVariable String restaurantId) {
        return ResponseEntity.ok(ApiResponse.success(
                menuService.getCategories(restaurantId)));
    }

    @GetMapping("/{restaurantId}/items/{itemId}")
    @Operation(summary = "Get single menu item (UC3)")
    public ResponseEntity<ApiResponse<MenuItemResponse>> getItem(
            @PathVariable String restaurantId,
            @PathVariable String itemId) {
        return ResponseEntity.ok(ApiResponse.success(
                menuService.getItem(restaurantId, itemId)));
    }

    @GetMapping("/{restaurantId}/filter")
    @Operation(summary = "Filter menu items — veg, meal type, keyword (UC3)")
    public ResponseEntity<ApiResponse<List<MenuItemResponse>>> filter(
            @PathVariable String restaurantId,
            @RequestParam(required = false) Boolean isVeg,
            @RequestParam(required = false) Boolean isVegan,
            @RequestParam(required = false) Boolean isSpicy,
            @RequestParam(required = false) String mealType,
            @RequestParam(required = false) String categoryId,
            @RequestParam(required = false) String keyword) {
        return ResponseEntity.ok(ApiResponse.success("Filtered items",
                menuService.filterItems(restaurantId, isVeg, isVegan,
                        isSpicy, mealType, categoryId, keyword)));
    }

    @GetMapping("/{restaurantId}/best-sellers")
    @Operation(summary = "Get best-selling dishes")
    public ResponseEntity<ApiResponse<List<MenuItemResponse>>> bestSellers(
            @PathVariable String restaurantId,
            @RequestParam(defaultValue = "5") int limit) {
        return ResponseEntity.ok(ApiResponse.success(
                menuService.getBestSellers(restaurantId, limit)));
    }

    @GetMapping("/{restaurantId}/todays-special")
    @Operation(summary = "Get today's special dishes")
    public ResponseEntity<ApiResponse<List<MenuItemResponse>>> todaysSpecials(
            @PathVariable String restaurantId) {
        return ResponseEntity.ok(ApiResponse.success(
                menuService.getTodaysSpecials(restaurantId)));
    }

    @GetMapping("/{restaurantId}/most-rated")
    @Operation(summary = "Get most-rated dishes")
    public ResponseEntity<ApiResponse<List<MenuItemResponse>>> mostRated(
            @PathVariable String restaurantId,
            @RequestParam(defaultValue = "5") int limit) {
        return ResponseEntity.ok(ApiResponse.success(
                menuService.getMostRated(restaurantId, limit)));
    }

    @PostMapping("/{restaurantId}/categories")
    @Operation(summary = "Add menu category (OWNER)")
    public ResponseEntity<ApiResponse<MenuCategoryResponse>> addCategory(
            @PathVariable String restaurantId,
            @RequestHeader("X-User-Id") String ownerId,
            @Valid @RequestBody MenuCategoryRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Category added",
                        menuService.addCategory(restaurantId, ownerId, request)));
    }

    @PostMapping("/{restaurantId}/items")
    @Operation(summary = "Add menu item (OWNER)")
    public ResponseEntity<ApiResponse<MenuItemResponse>> addItem(
            @PathVariable String restaurantId,
            @RequestHeader("X-User-Id") String ownerId,
            @Valid @RequestBody MenuItemRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Item added",
                        menuService.addItem(restaurantId, ownerId, request)));
    }

    @PutMapping("/items/{itemId}")
    @Operation(summary = "Update menu item (OWNER)")
    public ResponseEntity<ApiResponse<MenuItemResponse>> updateItem(
            @PathVariable String itemId,
            @RequestHeader("X-User-Id") String ownerId,
            @Valid @RequestBody MenuItemRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Item updated",
                menuService.updateItem(itemId, ownerId, request)));
    }

    @PatchMapping("/items/{itemId}/toggle-availability")
    @Operation(summary = "Toggle item available/unavailable (OWNER)")
    public ResponseEntity<ApiResponse<MenuItemResponse>> toggleAvailability(
            @PathVariable String itemId,
            @RequestHeader("X-User-Id") String ownerId) {
        return ResponseEntity.ok(ApiResponse.success("Availability toggled",
                menuService.toggleAvailability(itemId, ownerId)));
    }

    @PatchMapping("/items/{itemId}/toggle-special")
    @Operation(summary = "Toggle today's special flag (OWNER)")
    public ResponseEntity<ApiResponse<MenuItemResponse>> toggleSpecial(
            @PathVariable String itemId,
            @RequestHeader("X-User-Id") String ownerId) {
        return ResponseEntity.ok(ApiResponse.success("Special toggled",
                menuService.toggleTodaysSpecial(itemId, ownerId)));
    }

    @DeleteMapping("/items/{itemId}")
    @Operation(summary = "Delete menu item (OWNER)")
    public ResponseEntity<ApiResponse<Void>> deleteItem(
            @PathVariable String itemId,
            @RequestHeader("X-User-Id") String ownerId) {
        menuService.deleteItem(itemId, ownerId);
        return ResponseEntity.ok(ApiResponse.success("Item deleted", null));
    }

    @PatchMapping("/internal/items/{itemId}/increment-order")
    @Operation(summary = "Increment order count (order-service)")
    public ResponseEntity<Void> incrementOrder(
            @PathVariable String itemId) {
        menuService.incrementOrderCount(itemId);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/internal/items/{itemId}/rating")
    @Operation(summary = "Update item rating (support-service)")
    public ResponseEntity<Void> updateRating(
            @PathVariable String itemId,
            @RequestParam double rating) {
        menuService.updateItemRating(itemId, rating);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/search")
    @Operation(summary = "Search dishes by name across all restaurants")
    public ResponseEntity<ApiResponse<List<MenuItemResponse>>> searchDishes(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "20") int limit) {
        return ResponseEntity.ok(ApiResponse.success(
                "Dish search results",
                menuService.searchDishes(keyword, limit)));
    }

    @GetMapping("/{restaurantId}/search")
    @Operation(summary = "Search dishes by name within a specific restaurant")
    public ResponseEntity<ApiResponse<List<MenuItemResponse>>> searchInRestaurant(
            @PathVariable String restaurantId,
            @RequestParam String keyword) {
        return ResponseEntity.ok(ApiResponse.success(
                "Dish search results",
                menuService.searchDishesInRestaurant(restaurantId, keyword)));
    }
}

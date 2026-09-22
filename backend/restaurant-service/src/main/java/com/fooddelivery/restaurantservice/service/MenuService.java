package com.fooddelivery.restaurantservice.service;

import com.fooddelivery.restaurantservice.dto.*;
import java.util.List;

public interface MenuService {

    MenuResponse getFullMenu(String restaurantId);
    List<MenuCategoryResponse> getCategories(String restaurantId);
    MenuItemResponse getItem(String restaurantId, String itemId);
    List<MenuItemResponse> filterItems(String restaurantId, Boolean isVeg,
                                       Boolean isVegan, Boolean isSpicy,
                                       String mealType, String categoryId,
                                       String keyword);
    List<MenuItemResponse> getBestSellers(String restaurantId, int limit);
    List<MenuItemResponse> getTodaysSpecials(String restaurantId);
    List<MenuItemResponse> getMostRated(String restaurantId, int limit);

    MenuCategoryResponse addCategory(String restaurantId, String ownerId, MenuCategoryRequest req);
    MenuItemResponse addItem(String restaurantId, String ownerId, MenuItemRequest req);
    MenuItemResponse updateItem(String itemId, String ownerId, MenuItemRequest req);
    MenuItemResponse toggleAvailability(String itemId, String ownerId);
    MenuItemResponse toggleTodaysSpecial(String itemId, String ownerId);
    void deleteItem(String itemId, String ownerId);

    void incrementOrderCount(String itemId);
    void updateItemRating(String itemId, double rating);
    List<MenuItemResponse> searchDishes(String keyword, int limit);
    List<MenuItemResponse> searchDishesInRestaurant(String restaurantId, String keyword);
}

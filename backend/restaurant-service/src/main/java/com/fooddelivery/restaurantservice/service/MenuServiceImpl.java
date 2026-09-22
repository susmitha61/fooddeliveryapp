package com.fooddelivery.restaurantservice.service;

import com.fooddelivery.restaurantservice.dto.*;
import com.fooddelivery.restaurantservice.entity.*;
import com.fooddelivery.restaurantservice.exception.ApiException;
import com.fooddelivery.restaurantservice.repository.*;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class MenuServiceImpl implements MenuService {

    private final MenuItemRepository itemRepo;
    private final MenuCategoryRepository catRepo;
    private final RestaurantRepository restRepo;

    @Autowired(required = false)
    private HttpServletRequest httpServletRequest;

    @Override
    public MenuCategoryResponse addCategory(String restaurantId, String ownerId, MenuCategoryRequest req) {
        Restaurant r = getOwned(restaurantId, ownerId);
        MenuCategory cat = MenuCategory.builder()
                .restaurant(r)
                .name(req.getName())
                .description(req.getDescription())
                .displayOrder(req.getDisplayOrder() != null ? req.getDisplayOrder() : 0)
                .build();
        return MenuCategoryResponse.from(catRepo.save(cat), true);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MenuCategoryResponse> getCategories(String restaurantId) {
        return catRepo.findByRestaurantIdAndIsActiveTrueOrderByDisplayOrderAsc(restaurantId)
                .stream().map(c -> MenuCategoryResponse.from(c, true)).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public MenuResponse getFullMenu(String restaurantId) {
        Restaurant r = restRepo.findById(restaurantId).orElseThrow(() -> new ApiException("Restaurant not found", HttpStatus.NOT_FOUND, "RESTAURANT_NOT_FOUND"));
        List<MenuCategoryResponse> cats = getCategories(restaurantId);
        return MenuResponse.builder()
                .restaurantId(r.getId())
                .restaurantName(r.getName())
                .isPureVeg(r.getIsPureVeg())
                .categories(cats)
                .build();
    }

    @Override
    public MenuItemResponse addItem(String restaurantId, String ownerId, MenuItemRequest req) {
        Restaurant r = getOwned(restaurantId, ownerId);
        MenuCategory category = null;
        if (req.getCategoryId() != null && !req.getCategoryId().isBlank()) {
            category = catRepo.findById(req.getCategoryId()).orElse(null);
        }
        MenuItem item = MenuItem.builder()
                .restaurant(r)
                .category(category)
                .name(req.getName())
                .description(req.getDescription())
                .price(req.getPrice())
                .isAvailable(req.getIsAvailable() != null ? req.getIsAvailable() : true)
                .isVegetarian(req.getIsVegetarian() != null ? req.getIsVegetarian() : false)
                .isVegan(req.getIsVegan() != null ? req.getIsVegan() : false)
                .isSpicy(req.getIsSpicy() != null ? req.getIsSpicy() : false)
                .imageUrl(req.getImageUrl())
                .mealType(req.getMealType() != null ? req.getMealType() : "ALL_DAY")
                .build();
        return MenuItemResponse.from(itemRepo.save(item));
    }

    @Override
    @Transactional(readOnly = true)
    public MenuItemResponse getItem(String restaurantId, String itemId) {
        MenuItem item = itemRepo.findById(itemId).orElseThrow(() -> new ApiException("Menu item not found", HttpStatus.NOT_FOUND, "ITEM_NOT_FOUND"));
        return MenuItemResponse.from(item);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MenuItemResponse> filterItems(String restaurantId, Boolean isVeg, Boolean isVegan, Boolean isSpicy, String mealType, String categoryId, String keyword) {
        return itemRepo.findByRestaurantIdAndIsAvailableTrue(restaurantId).stream()
                .filter(i -> isVeg == null || i.getIsVegetarian().equals(isVeg))
                .filter(i -> isVegan == null || i.getIsVegan().equals(isVegan))
                .filter(i -> isSpicy == null || i.getIsSpicy().equals(isSpicy))
                .filter(i -> keyword == null || i.getName().toLowerCase().contains(keyword.toLowerCase()))
                .map(MenuItemResponse::from).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<MenuItemResponse> getBestSellers(String restaurantId, int limit) {
        return itemRepo.findByRestaurantIdAndIsAvailableTrue(restaurantId).stream().limit(limit).map(MenuItemResponse::from).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<MenuItemResponse> getTodaysSpecials(String restaurantId) {
        return itemRepo.findByRestaurantIdAndIsAvailableTrue(restaurantId).stream().filter(MenuItem::getIsTodaysSpecial).map(MenuItemResponse::from).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<MenuItemResponse> getMostRated(String restaurantId, int limit) {
        return itemRepo.findByRestaurantIdAndIsAvailableTrue(restaurantId).stream().limit(limit).map(MenuItemResponse::from).collect(Collectors.toList());
    }

    @Override
    public MenuItemResponse updateItem(String itemId, String ownerId, MenuItemRequest req) {
        MenuItem item = getOwnedItem(itemId, ownerId);
        if (req.getName() != null) item.setName(req.getName());
        if (req.getDescription() != null) item.setDescription(req.getDescription());
        if (req.getPrice() != null) item.setPrice(req.getPrice());
        if (req.getImageUrl() != null) item.setImageUrl(req.getImageUrl());
        return MenuItemResponse.from(itemRepo.save(item));
    }

    @Override
    public MenuItemResponse toggleAvailability(String itemId, String ownerId) {
        MenuItem item = getOwnedItem(itemId, ownerId);
        item.setIsAvailable(!item.getIsAvailable());
        return MenuItemResponse.from(itemRepo.save(item));
    }

    @Override
    public MenuItemResponse toggleTodaysSpecial(String itemId, String ownerId) {
        MenuItem item = getOwnedItem(itemId, ownerId);
        item.setIsTodaysSpecial(!item.getIsTodaysSpecial());
        return MenuItemResponse.from(itemRepo.save(item));
    }

    @Override
    public void deleteItem(String itemId, String ownerId) {
        MenuItem item = getOwnedItem(itemId, ownerId);
        itemRepo.delete(item);
    }

    @Override
    public void incrementOrderCount(String itemId) {
        itemRepo.findById(itemId).ifPresent(i -> {
            i.setOrderCount(i.getOrderCount() + 1);
            itemRepo.save(i);
        });
    }

    @Override
    public void updateItemRating(String itemId, double rating) {
        itemRepo.findById(itemId).ifPresent(i -> {
            double updated = (i.getRating() * i.getTotalRatings() + rating) / (i.getTotalRatings() + 1);
            i.setRating(Math.round(updated * 10.0) / 10.0);
            i.setTotalRatings(i.getTotalRatings() + 1);
            itemRepo.save(i);
        });
    }

    @Override
    @Transactional(readOnly = true)
    public List<MenuItemResponse> searchDishes(String keyword, int limit) {
        return itemRepo.findAll().stream()
                .filter(i -> i.getName().toLowerCase().contains(keyword.toLowerCase()))
                .limit(limit)
                .map(MenuItemResponse::from)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<MenuItemResponse> searchDishesInRestaurant(String restaurantId, String keyword) {
        return itemRepo.findByRestaurantIdAndIsAvailableTrue(restaurantId).stream()
                .filter(i -> i.getName().toLowerCase().contains(keyword.toLowerCase()))
                .map(MenuItemResponse::from)
                .collect(Collectors.toList());
    }

    private Restaurant getOwned(String restaurantId, String ownerId) {
        Restaurant r = restRepo.findById(restaurantId).orElseThrow(() -> new ApiException("Restaurant not found", HttpStatus.NOT_FOUND, "RESTAURANT_NOT_FOUND"));
        String role = httpServletRequest != null ? httpServletRequest.getHeader("X-User-Role") : null;
        boolean isAdmin = role != null && role.toUpperCase().contains("ADMIN");
        boolean isOwner = r.getOwnerId().equals(ownerId);
        boolean isAssignedManager = r.getManagerIds() != null && r.getManagerIds().contains(ownerId);
        if (!isAdmin && !isOwner && !isAssignedManager)
            throw new ApiException("You do not have management access for this restaurant", HttpStatus.FORBIDDEN, "NOT_OWNER");
        return r;
    }

    private MenuItem getOwnedItem(String itemId, String ownerId) {
        MenuItem item = itemRepo.findById(itemId).orElseThrow(() -> new ApiException("Menu item not found", HttpStatus.NOT_FOUND, "ITEM_NOT_FOUND"));
        String role = httpServletRequest != null ? httpServletRequest.getHeader("X-User-Role") : null;
        boolean isAdmin = role != null && role.toUpperCase().contains("ADMIN");
        boolean isOwner = item.getRestaurant().getOwnerId().equals(ownerId);
        boolean isAssignedManager = item.getRestaurant().getManagerIds() != null && item.getRestaurant().getManagerIds().contains(ownerId);
        if (!isAdmin && !isOwner && !isAssignedManager)
            throw new ApiException("You do not have management access for this restaurant", HttpStatus.FORBIDDEN, "NOT_OWNER");
        return item;
    }
}

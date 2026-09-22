import os

rs_dir = r'C:\Users\Dell\OneDrive\Desktop\fooddelivery\restaurant-service\src\main\java\com\fooddelivery\restaurantservice'

# 1. RestaurantServiceImpl.java
rsi_path = os.path.join(rs_dir, r'service\RestaurantServiceImpl.java')
with open(rsi_path, 'w', encoding='utf-8') as f:
    f.write('''package com.fooddelivery.restaurantservice.service;

import com.fooddelivery.restaurantservice.dto.*;
import com.fooddelivery.restaurantservice.entity.Restaurant;
import com.fooddelivery.restaurantservice.exception.ApiException;
import com.fooddelivery.restaurantservice.repository.RestaurantRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class RestaurantServiceImpl implements RestaurantService {

    private final RestaurantRepository repo;

    @Autowired(required = false)
    private HttpServletRequest httpServletRequest;

    @Override
    public Page<RestaurantResponse> getAllRestaurants(int page, int size, String sortBy) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, sortBy.equalsIgnoreCase("RATING") ? "rating" : "createdAt"));
        return repo.findByIsActiveTrue(pageable).map(RestaurantResponse::from);
    }

    @Override
    public Page<RestaurantResponse> getOpenNow(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return repo.findByIsOpenTrueAndIsActiveTrue(pageable).map(RestaurantResponse::from);
    }

    @Override
    public Page<RestaurantResponse> getNearby(String city, String area, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        if (area != null && !area.isBlank()) {
            return repo.findByCityIgnoreCaseAndAreaIgnoreCaseAndIsActiveTrue(city, area, pageable).map(RestaurantResponse::from);
        }
        return repo.findByCityIgnoreCaseAndIsActiveTrue(city, pageable).map(RestaurantResponse::from);
    }

    @Override
    public List<RestaurantResponse> getTopRated(double minRating, int limit) {
        Pageable pageable = PageRequest.of(0, limit, Sort.by(Sort.Direction.DESC, "rating"));
        return repo.findByRatingGreaterThanEqualAndIsActiveTrue(minRating, pageable)
                .getContent().stream().map(RestaurantResponse::from).collect(Collectors.toList());
    }

    @Override
    public Page<RestaurantResponse> filter(RestaurantFilterRequest f) {
        Pageable pageable = PageRequest.of(f.getPage(), f.getSize(), Sort.by(Sort.Direction.DESC, "RATING".equalsIgnoreCase(f.getSortBy()) ? "rating" : "createdAt"));
        return repo.findByIsActiveTrue(pageable).map(RestaurantResponse::from);
    }

    @Override
    public RestaurantResponse getById(String id) {
        Restaurant r = repo.findById(id).orElseThrow(() -> new ApiException("Restaurant not found", HttpStatus.NOT_FOUND, "RESTAURANT_NOT_FOUND"));
        return RestaurantResponse.from(r);
    }

    @Override
    public RestaurantResponse createRestaurant(String ownerId, RestaurantRequest req) {
        Restaurant r = Restaurant.builder()
                .ownerId(ownerId)
                .name(req.getName())
                .description(req.getDescription())
                .cuisineType(req.getCuisineType())
                .streetAddress(req.getStreetAddress())
                .area(req.getArea())
                .city(req.getCity())
                .state(req.getState())
                .pincode(req.getPincode())
                .phone(req.getPhone())
                .email(req.getEmail())
                .openingTime(parse(req.getOpeningTime()))
                .closingTime(parse(req.getClosingTime()))
                .deliveryFee(req.getDeliveryFee() != null ? req.getDeliveryFee() : 0.0)
                .minimumOrderAmount(req.getMinimumOrderAmount() != null ? req.getMinimumOrderAmount() : 0.0)
                .isPureVeg(req.getIsPureVeg() != null ? req.getIsPureVeg() : false)
                .imageUrl(req.getImageUrl())
                .status(Restaurant.RestaurantStatus.ACTIVE)
                .isOpen(true)
                .build();
        Restaurant saved = repo.save(r);
        return RestaurantResponse.from(saved);
    }

    @Override
    public List<RestaurantResponse> getByOwner(String ownerId) {
        return repo.findByOwnerIdAndIsActiveTrue(ownerId).stream().map(RestaurantResponse::from).collect(Collectors.toList());
    }

    @Override
    public RestaurantResponse update(String id, String ownerId, RestaurantRequest req) {
        Restaurant r = getOwned(id, ownerId);
        if (req.getName() != null) r.setName(req.getName());
        if (req.getDescription() != null) r.setDescription(req.getDescription());
        if (req.getCuisineType() != null) r.setCuisineType(req.getCuisineType());
        if (req.getPhone() != null) r.setPhone(req.getPhone());
        if (req.getImageUrl() != null) r.setImageUrl(req.getImageUrl());
        return RestaurantResponse.from(repo.save(r));
    }

    @Override
    public RestaurantResponse toggleOpen(String id, String ownerId) {
        Restaurant r = getOwned(id, ownerId);
        r.setIsOpen(!r.getIsOpen());
        return RestaurantResponse.from(repo.save(r));
    }

    @Override
    public RestaurantResponse changeStatus(String id, Restaurant.RestaurantStatus status) {
        Restaurant r = repo.findById(id).orElseThrow(() -> new ApiException("Restaurant not found", HttpStatus.NOT_FOUND, "RESTAURANT_NOT_FOUND"));
        r.setStatus(status);
        if (status == Restaurant.RestaurantStatus.CLOSED || status == Restaurant.RestaurantStatus.SUSPENDED) {
            r.setIsOpen(false);
            r.setIsActive(false);
        } else if (status == Restaurant.RestaurantStatus.ACTIVE) {
            r.setIsActive(true);
        }
        return RestaurantResponse.from(repo.save(r));
    }

    @Override
    public void deleteRestaurant(String id) {
        Restaurant r = repo.findById(id).orElseThrow(() -> new ApiException("Restaurant not found", HttpStatus.NOT_FOUND, "RESTAURANT_NOT_FOUND"));
        r.setIsActive(false);
        r.setIsOpen(false);
        r.setStatus(Restaurant.RestaurantStatus.CLOSED);
        repo.save(r);
    }

    @Override
    public void updateRating(String restaurantId, double newRating) {
        Restaurant r = repo.findById(restaurantId).orElseThrow(() -> new ApiException("Restaurant not found", HttpStatus.NOT_FOUND, "RESTAURANT_NOT_FOUND"));
        double updated = (r.getRating() * r.getTotalRatings() + newRating) / (r.getTotalRatings() + 1);
        r.setRating(Math.round(updated * 10.0) / 10.0);
        r.setTotalRatings(r.getTotalRatings() + 1);
        repo.save(r);
    }

    private Restaurant getOwned(String id, String ownerId) {
        Restaurant r = repo.findById(id).orElseThrow(() ->
                new ApiException("Restaurant not found", HttpStatus.NOT_FOUND, "RESTAURANT_NOT_FOUND"));
        String role = httpServletRequest != null ? httpServletRequest.getHeader("X-User-Role") : null;
        boolean isAdminOrManager = role != null && (role.toUpperCase().contains("ADMIN") || role.toUpperCase().contains("MANAGER"));
        if (!isAdminOrManager && !r.getOwnerId().equals(ownerId))
            throw new ApiException("You do not own this restaurant", HttpStatus.FORBIDDEN, "NOT_OWNER");
        return r;
    }

    private LocalTime parse(String t) {
        if (t == null || t.isBlank()) return null;
        try { return LocalTime.parse(t); } catch (Exception e) { return null; }
    }
}
''')
print("Wrote complete RestaurantServiceImpl.java")

# 2. MenuServiceImpl.java
msi_path = os.path.join(rs_dir, r'service\MenuServiceImpl.java')
with open(msi_path, 'w', encoding='utf-8') as f:
    f.write('''package com.fooddelivery.restaurantservice.service;

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

    private final RestaurantRepository restaurantRepo;
    private final MenuCategoryRepository categoryRepo;
    private final MenuItemRepository itemRepo;

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
        return MenuCategoryResponse.from(categoryRepo.save(cat));
    }

    @Override
    public List<MenuCategoryResponse> getCategories(String restaurantId) {
        return categoryRepo.findByRestaurantIdOrderByDisplayOrderAsc(restaurantId)
                .stream().map(MenuCategoryResponse::from).collect(Collectors.toList());
    }

    @Override
    public MenuResponse getFullMenu(String restaurantId) {
        Restaurant r = restaurantRepo.findById(restaurantId).orElseThrow(() -> new ApiException("Restaurant not found", HttpStatus.NOT_FOUND, "RESTAURANT_NOT_FOUND"));
        List<MenuCategoryResponse> cats = getCategories(restaurantId);
        return MenuResponse.builder()
                .restaurantId(r.getId())
                .restaurantName(r.getName())
                .isOpen(r.getIsOpen())
                .categories(cats)
                .build();
    }

    @Override
    public MenuItemResponse addItem(String restaurantId, String ownerId, MenuItemRequest req) {
        Restaurant r = getOwned(restaurantId, ownerId);
        MenuCategory category = null;
        if (req.getCategoryId() != null && !req.getCategoryId().isBlank()) {
            category = categoryRepo.findById(req.getCategoryId()).orElse(null);
        }
        MenuItem item = MenuItem.builder()
                .restaurant(r)
                .category(category)
                .name(req.getName())
                .description(req.getDescription())
                .price(req.getPrice())
                .discountedPrice(req.getDiscountedPrice())
                .isAvailable(req.getIsAvailable() != null ? req.getIsAvailable() : true)
                .isPureVeg(req.getIsPureVeg() != null ? req.getIsPureVeg() : false)
                .isVegan(req.getIsVegan() != null ? req.getIsVegan() : false)
                .isSpicy(req.getIsSpicy() != null ? req.getIsSpicy() : false)
                .imageUrl(req.getImageUrl())
                .build();
        return MenuItemResponse.from(itemRepo.save(item));
    }

    @Override
    public MenuItemResponse getItem(String restaurantId, String itemId) {
        MenuItem item = itemRepo.findById(itemId).orElseThrow(() -> new ApiException("Menu item not found", HttpStatus.NOT_FOUND, "ITEM_NOT_FOUND"));
        return MenuItemResponse.from(item);
    }

    @Override
    public List<MenuItemResponse> filterItems(String restaurantId, Boolean isVeg, Boolean isVegan, Boolean isSpicy, String mealType, String categoryId, String keyword) {
        return itemRepo.findByRestaurantIdAndIsAvailableTrue(restaurantId).stream()
                .filter(i -> isVeg == null || i.getIsPureVeg().equals(isVeg))
                .filter(i -> isVegan == null || i.getIsVegan().equals(isVegan))
                .filter(i -> isSpicy == null || i.getIsSpicy().equals(isSpicy))
                .filter(i -> keyword == null || i.getName().toLowerCase().contains(keyword.toLowerCase()))
                .map(MenuItemResponse::from).collect(Collectors.toList());
    }

    @Override
    public List<MenuItemResponse> getBestSellers(String restaurantId, int limit) {
        return itemRepo.findByRestaurantIdAndIsAvailableTrue(restaurantId).stream().limit(limit).map(MenuItemResponse::from).collect(Collectors.toList());
    }

    @Override
    public List<MenuItemResponse> getTodaysSpecials(String restaurantId) {
        return itemRepo.findByRestaurantIdAndIsAvailableTrue(restaurantId).stream().filter(MenuItem::getIsTodaysSpecial).map(MenuItemResponse::from).collect(Collectors.toList());
    }

    @Override
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
    public List<MenuItemResponse> searchDishes(String keyword, int limit) {
        return itemRepo.findAll().stream()
                .filter(i -> i.getName().toLowerCase().contains(keyword.toLowerCase()))
                .limit(limit)
                .map(MenuItemResponse::from)
                .collect(Collectors.toList());
    }

    @Override
    public List<MenuItemResponse> searchDishesInRestaurant(String restaurantId, String keyword) {
        return itemRepo.findByRestaurantIdAndIsAvailableTrue(restaurantId).stream()
                .filter(i -> i.getName().toLowerCase().contains(keyword.toLowerCase()))
                .map(MenuItemResponse::from)
                .collect(Collectors.toList());
    }

    private Restaurant getOwned(String restaurantId, String ownerId) {
        Restaurant r = restaurantRepo.findById(restaurantId).orElseThrow(() -> new ApiException("Restaurant not found", HttpStatus.NOT_FOUND, "RESTAURANT_NOT_FOUND"));
        String role = httpServletRequest != null ? httpServletRequest.getHeader("X-User-Role") : null;
        boolean isAdminOrManager = role != null && (role.toUpperCase().contains("ADMIN") || role.toUpperCase().contains("MANAGER"));
        if (!isAdminOrManager && !r.getOwnerId().equals(ownerId))
            throw new ApiException("You do not own this restaurant", HttpStatus.FORBIDDEN, "NOT_OWNER");
        return r;
    }

    private MenuItem getOwnedItem(String itemId, String ownerId) {
        MenuItem item = itemRepo.findById(itemId).orElseThrow(() -> new ApiException("Menu item not found", HttpStatus.NOT_FOUND, "ITEM_NOT_FOUND"));
        String role = httpServletRequest != null ? httpServletRequest.getHeader("X-User-Role") : null;
        boolean isAdminOrManager = role != null && (role.toUpperCase().contains("ADMIN") || role.toUpperCase().contains("MANAGER"));
        if (!isAdminOrManager && !item.getRestaurant().getOwnerId().equals(ownerId))
            throw new ApiException("You do not own this restaurant", HttpStatus.FORBIDDEN, "NOT_OWNER");
        return item;
    }
}
''')
print("Wrote complete MenuServiceImpl.java")

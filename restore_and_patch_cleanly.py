import os

rs_dir = r'C:\Users\Dell\OneDrive\Desktop\fooddelivery\restaurant-service\src\main\java\com\fooddelivery\restaurantservice'

# 1. MenuService.java
ms_path = os.path.join(rs_dir, r'service\MenuService.java')
with open(ms_path, 'w', encoding='utf-8') as f:
    f.write('''package com.fooddelivery.restaurantservice.service;

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
''')
print("Wrote clean MenuService.java")

# 2. RestaurantService.java
rs_path = os.path.join(rs_dir, r'service\RestaurantService.java')
with open(rs_path, 'w', encoding='utf-8') as f:
    f.write('''package com.fooddelivery.restaurantservice.service;

import com.fooddelivery.restaurantservice.dto.*;
import com.fooddelivery.restaurantservice.entity.Restaurant;
import org.springframework.data.domain.Page;
import java.util.List;

public interface RestaurantService {

    Page<RestaurantResponse> getAllRestaurants(int page, int size, String sortBy);
    Page<RestaurantResponse> getOpenNow(int page, int size);
    Page<RestaurantResponse> getNearby(String city, String area, int page, int size);
    List<RestaurantResponse> getTopRated(double minRating, int limit);
    Page<RestaurantResponse> filter(RestaurantFilterRequest filter);
    RestaurantResponse getById(String id);

    RestaurantResponse createRestaurant(String ownerId, RestaurantRequest req);
    List<RestaurantResponse> getByOwner(String ownerId);
    
    RestaurantResponse update(String id, String ownerId, RestaurantRequest req);
    RestaurantResponse toggleOpen(String id, String ownerId);

    RestaurantResponse changeStatus(String id, Restaurant.RestaurantStatus status);
    void deleteRestaurant(String id);
    void updateRating(String restaurantId, double newRating);
}
''')
print("Wrote clean RestaurantService.java")

# 3. RestaurantController.java
rc_path = os.path.join(rs_dir, r'controller\RestaurantController.java')
with open(rc_path, 'w', encoding='utf-8') as f:
    f.write('''package com.fooddelivery.restaurantservice.controller;

import com.fooddelivery.restaurantservice.dto.*;
import com.fooddelivery.restaurantservice.entity.Restaurant;
import com.fooddelivery.restaurantservice.service.RestaurantService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/restaurants")
@RequiredArgsConstructor
@Tag(name = "Restaurants", description = "BRD Use Case 2 — Restaurant Search & Management")
public class RestaurantController {

    private final RestaurantService restaurantService;

    @GetMapping
    @Operation(summary = "Get all active restaurants")
    public ResponseEntity<ApiResponse<Page<RestaurantResponse>>> getAll(
            @RequestParam(defaultValue = "0")      int page,
            @RequestParam(defaultValue = "10")     int size,
            @RequestParam(defaultValue = "RATING") String sortBy) {
        return ResponseEntity.ok(ApiResponse.success(
                restaurantService.getAllRestaurants(page, size, sortBy)));
    }

    @GetMapping("/open-now")
    @Operation(summary = "Get restaurants open right now")
    public ResponseEntity<ApiResponse<Page<RestaurantResponse>>> openNow(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success("Open restaurants",
                restaurantService.getOpenNow(page, size)));
    }

    @GetMapping("/nearby")
    @Operation(summary = "Get restaurants in same city & area")
    public ResponseEntity<ApiResponse<Page<RestaurantResponse>>> nearby(
            @RequestParam String city,
            @RequestParam(required = false) String area,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success("Nearby restaurants",
                restaurantService.getNearby(city, area, page, size)));
    }

    @GetMapping("/top-rated")
    @Operation(summary = "Get top-rated restaurants")
    public ResponseEntity<ApiResponse<List<RestaurantResponse>>> topRated(
            @RequestParam(defaultValue = "4.0") double minRating,
            @RequestParam(defaultValue = "10")  int limit) {
        return ResponseEntity.ok(ApiResponse.success(
                restaurantService.getTopRated(minRating, limit)));
    }

    @GetMapping("/filter")
    @Operation(summary = "Filter: city, area, cuisine, veg, open, rating, keyword")
    public ResponseEntity<ApiResponse<Page<RestaurantResponse>>> filter(
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String area,
            @RequestParam(required = false) String pincode,
            @RequestParam(required = false) String cuisineType,
            @RequestParam(required = false) String mealType,
            @RequestParam(required = false) Boolean isPureVeg,
            @RequestParam(required = false) Boolean isOpen,
            @RequestParam(required = false) Double minRating,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "RATING") String sortBy,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size) {

        RestaurantFilterRequest f = new RestaurantFilterRequest();
        f.setCity(city);         f.setArea(area);
        f.setPincode(pincode);   f.setCuisineType(cuisineType);
        f.setMealType(mealType); f.setIsPureVeg(isPureVeg);
        f.setIsOpen(isOpen);     f.setMinRating(minRating);
        f.setKeyword(keyword);   f.setSortBy(sortBy);
        f.setPage(page);         f.setSize(size);

        return ResponseEntity.ok(ApiResponse.success("Filter results",
                restaurantService.filter(f)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get restaurant by ID")
    public ResponseEntity<ApiResponse<RestaurantResponse>> getById(
            @PathVariable String id) {
        return ResponseEntity.ok(
                ApiResponse.success(restaurantService.getById(id)));
    }

    @PostMapping
    @Operation(summary = "Create restaurant (OWNER)")
    public ResponseEntity<ApiResponse<RestaurantResponse>> create(
            @RequestHeader("X-User-Id") String ownerId,
            @Valid @RequestBody RestaurantRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Restaurant created",
                        restaurantService.createRestaurant(ownerId, request)));
    }

    @GetMapping("/my-restaurants")
    @Operation(summary = "Get owner's restaurants")
    public ResponseEntity<ApiResponse<List<RestaurantResponse>>> mine(
            @RequestHeader("X-User-Id") String ownerId) {
        return ResponseEntity.ok(ApiResponse.success(
                restaurantService.getByOwner(ownerId)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update restaurant (OWNER)")
    public ResponseEntity<ApiResponse<RestaurantResponse>> update(
            @PathVariable String id,
            @RequestHeader("X-User-Id") String ownerId,
            @Valid @RequestBody RestaurantRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Restaurant updated",
                restaurantService.update(id, ownerId, request)));
    }

    @PatchMapping("/{id}/toggle-open")
    @Operation(summary = "Toggle restaurant open/closed (OWNER)")
    public ResponseEntity<ApiResponse<RestaurantResponse>> toggleOpen(
            @PathVariable String id,
            @RequestHeader("X-User-Id") String ownerId) {
        return ResponseEntity.ok(ApiResponse.success("Status toggled",
                restaurantService.toggleOpen(id, ownerId)));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Change restaurant status (ADMIN)")
    public ResponseEntity<ApiResponse<RestaurantResponse>> changeStatus(
            @PathVariable String id,
            @RequestParam Restaurant.RestaurantStatus status) {
        return ResponseEntity.ok(ApiResponse.success("Status changed",
                restaurantService.changeStatus(id, status)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Deactivate restaurant (ADMIN)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String id) {
        restaurantService.deleteRestaurant(id);
        return ResponseEntity.ok(
                ApiResponse.success("Restaurant deactivated", null));
    }

    @PatchMapping("/internal/{id}/rating")
    @Operation(summary = "Update restaurant rating (support-service)")
    public ResponseEntity<Void> updateRating(
            @PathVariable String id,
            @RequestParam double rating) {
        restaurantService.updateRating(id, rating);
        return ResponseEntity.ok().build();
    }
}
''')
print("Wrote clean RestaurantController.java")

# 4. MenuController.java
mc_path = os.path.join(rs_dir, r'controller\MenuController.java')
with open(mc_path, 'w', encoding='utf-8') as f:
    f.write('''package com.fooddelivery.restaurantservice.controller;

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
''')
print("Wrote clean MenuController.java")

# 5. Patch RestaurantServiceImpl.java with HttpServletRequest injection
rsi_path = os.path.join(rs_dir, r'service\RestaurantServiceImpl.java')
with open(rsi_path, 'r', encoding='utf-8') as f:
    rsi = f.read()

if 'import jakarta.servlet.http.HttpServletRequest;' not in rsi:
    rsi = rsi.replace(
        'import java.util.*;',
        'import java.util.*;\nimport jakarta.servlet.http.HttpServletRequest;\nimport org.springframework.beans.factory.annotation.Autowired;'
    )

if 'private HttpServletRequest httpServletRequest;' not in rsi:
    rsi = rsi.replace(
        'private final RestaurantRepository repo;',
        'private final RestaurantRepository repo;\n\n    @Autowired(required = false)\n    private HttpServletRequest httpServletRequest;'
    )

old_r_get_owned = '''    private Restaurant getOwned(String id, String ownerId) {
        Restaurant r = repo.findById(id).orElseThrow(() ->
                new ApiException("Restaurant not found",
                        HttpStatus.NOT_FOUND, "RESTAURANT_NOT_FOUND"));
        // Both stored and compared as UUID from X-User-Id
        if (!r.getOwnerId().equals(ownerId))
            throw new ApiException("You do not own this restaurant",
                    HttpStatus.FORBIDDEN, "NOT_OWNER");
        return r;
    }'''

new_r_get_owned = '''    private Restaurant getOwned(String id, String ownerId) {
        Restaurant r = repo.findById(id).orElseThrow(() ->
                new ApiException("Restaurant not found",
                        HttpStatus.NOT_FOUND, "RESTAURANT_NOT_FOUND"));
        String role = httpServletRequest != null ? httpServletRequest.getHeader("X-User-Role") : null;
        boolean isAdminOrManager = role != null && (role.toUpperCase().contains("ADMIN") || role.toUpperCase().contains("MANAGER"));
        if (!isAdminOrManager && !r.getOwnerId().equals(ownerId))
            throw new ApiException("You do not own this restaurant",
                    HttpStatus.FORBIDDEN, "NOT_OWNER");
        return r;
    }'''

rsi = rsi.replace(old_r_get_owned, new_r_get_owned)
with open(rsi_path, 'w', encoding='utf-8') as f:
    f.write(rsi)
print("Patched RestaurantServiceImpl.java")

# 6. Patch MenuServiceImpl.java with HttpServletRequest injection
msi_path = os.path.join(rs_dir, r'service\MenuServiceImpl.java')
with open(msi_path, 'r', encoding='utf-8') as f:
    msi = f.read()

if 'import jakarta.servlet.http.HttpServletRequest;' not in msi:
    msi = msi.replace(
        'import java.util.List;',
        'import java.util.List;\nimport jakarta.servlet.http.HttpServletRequest;\nimport org.springframework.beans.factory.annotation.Autowired;'
    )

if 'private HttpServletRequest httpServletRequest;' not in msi:
    msi = msi.replace(
        'private final MenuItemRepository itemRepo;',
        'private final MenuItemRepository itemRepo;\n\n    @Autowired(required = false)\n    private HttpServletRequest httpServletRequest;'
    )

old_m_get_owned = '''    private Restaurant getOwned(String restaurantId, String ownerId) {
        Restaurant r = restaurantRepo.findById(restaurantId).orElseThrow(() ->
                new ApiException("Restaurant not found",
                        HttpStatus.NOT_FOUND, "RESTAURANT_NOT_FOUND"));
        if (!r.getOwnerId().equals(ownerId))
            throw new ApiException("You do not own this restaurant",
                    HttpStatus.FORBIDDEN, "NOT_OWNER");
        return r;
    }'''

new_m_get_owned = '''    private Restaurant getOwned(String restaurantId, String ownerId) {
        Restaurant r = restaurantRepo.findById(restaurantId).orElseThrow(() ->
                new ApiException("Restaurant not found",
                        HttpStatus.NOT_FOUND, "RESTAURANT_NOT_FOUND"));
        String role = httpServletRequest != null ? httpServletRequest.getHeader("X-User-Role") : null;
        boolean isAdminOrManager = role != null && (role.toUpperCase().contains("ADMIN") || role.toUpperCase().contains("MANAGER"));
        if (!isAdminOrManager && !r.getOwnerId().equals(ownerId))
            throw new ApiException("You do not own this restaurant",
                    HttpStatus.FORBIDDEN, "NOT_OWNER");
        return r;
    }'''

old_m_get_owned_item = '''    private MenuItem getOwnedItem(String itemId, String ownerId) {
        MenuItem item = itemRepo.findById(itemId).orElseThrow(() ->
                new ApiException("Menu item not found",
                        HttpStatus.NOT_FOUND, "ITEM_NOT_FOUND"));
        if (!item.getRestaurant().getOwnerId().equals(ownerId))
            throw new ApiException("You do not own this restaurant",
                    HttpStatus.FORBIDDEN, "NOT_OWNER");
        return item;
    }'''

new_m_get_owned_item = '''    private MenuItem getOwnedItem(String itemId, String ownerId) {
        MenuItem item = itemRepo.findById(itemId).orElseThrow(() ->
                new ApiException("Menu item not found",
                        HttpStatus.NOT_FOUND, "ITEM_NOT_FOUND"));
        String role = httpServletRequest != null ? httpServletRequest.getHeader("X-User-Role") : null;
        boolean isAdminOrManager = role != null && (role.toUpperCase().contains("ADMIN") || role.toUpperCase().contains("MANAGER"));
        if (!isAdminOrManager && !item.getRestaurant().getOwnerId().equals(ownerId))
            throw new ApiException("You do not own this restaurant",
                    HttpStatus.FORBIDDEN, "NOT_OWNER");
        return item;
    }'''

msi = msi.replace(old_m_get_owned, new_m_get_owned).replace(old_m_get_owned_item, new_m_get_owned_item)

with open(msi_path, 'w', encoding='utf-8') as f:
    f.write(msi)
print("Patched MenuServiceImpl.java")

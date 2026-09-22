import os

# Path definitions
rs_dir = r'C:\Users\Dell\OneDrive\Desktop\fooddelivery\restaurant-service\src\main\java\com\fooddelivery\restaurantservice'

# 1. Update RestaurantService.java
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
    RestaurantResponse update(String id, String ownerId, String role, RestaurantRequest req);
    
    RestaurantResponse toggleOpen(String id, String ownerId);
    RestaurantResponse toggleOpen(String id, String ownerId, String role);

    RestaurantResponse changeStatus(String id, Restaurant.RestaurantStatus status);
    void deleteRestaurant(String id);
    void updateRating(String restaurantId, double newRating);
}
''')
print("Updated RestaurantService.java")

# 2. Update RestaurantServiceImpl.java
rsi_path = os.path.join(rs_dir, r'service\RestaurantServiceImpl.java')
with open(rsi_path, 'r', encoding='utf-8') as f:
    rsi_content = f.read()

# Add overload methods for update & toggleOpen
if 'public RestaurantResponse update(String id, String ownerId, String role, RestaurantRequest req)' not in rsi_content:
    rsi_content = rsi_content.replace(
        'public RestaurantResponse update(String id, String ownerId,\n                                      RestaurantRequest req) {\n        Restaurant r = getOwned(id, ownerId);',
        'public RestaurantResponse update(String id, String ownerId, RestaurantRequest req) {\n        return update(id, ownerId, null, req);\n    }\n\n    @Override\n    public RestaurantResponse update(String id, String ownerId, String role, RestaurantRequest req) {\n        Restaurant r = getOwned(id, ownerId, role);'
    )

if 'public RestaurantResponse toggleOpen(String id, String ownerId, String role)' not in rsi_content:
    rsi_content = rsi_content.replace(
        'public RestaurantResponse toggleOpen(String id, String ownerId) {\n        Restaurant r = getOwned(id, ownerId);',
        'public RestaurantResponse toggleOpen(String id, String ownerId) {\n        return toggleOpen(id, ownerId, null);\n    }\n\n    @Override\n    public RestaurantResponse toggleOpen(String id, String ownerId, String role) {\n        Restaurant r = getOwned(id, ownerId, role);'
    )

# Update getOwned helper
old_get_owned = '''    private Restaurant getOwned(String id, String ownerId) {
        Restaurant r = repo.findById(id).orElseThrow(() ->
                new ApiException("Restaurant not found",
                        HttpStatus.NOT_FOUND, "RESTAURANT_NOT_FOUND"));
        // Both stored and compared as UUID from X-User-Id
        if (!r.getOwnerId().equals(ownerId))
            throw new ApiException("You do not own this restaurant",
                    HttpStatus.FORBIDDEN, "NOT_OWNER");
        return r;
    }'''

new_get_owned = '''    private Restaurant getOwned(String id, String ownerId) {
        return getOwned(id, ownerId, null);
    }

    private Restaurant getOwned(String id, String ownerId, String role) {
        Restaurant r = repo.findById(id).orElseThrow(() ->
                new ApiException("Restaurant not found",
                        HttpStatus.NOT_FOUND, "RESTAURANT_NOT_FOUND"));
        boolean isAdminOrManager = role != null && (role.toUpperCase().contains("ADMIN") || role.toUpperCase().contains("MANAGER"));
        if (!isAdminOrManager && !r.getOwnerId().equals(ownerId))
            throw new ApiException("You do not own this restaurant",
                    HttpStatus.FORBIDDEN, "NOT_OWNER");
        return r;
    }'''

rsi_content = rsi_content.replace(old_get_owned, new_get_owned)
with open(rsi_path, 'w', encoding='utf-8') as f:
    f.write(rsi_content)
print("Updated RestaurantServiceImpl.java")

# 3. Update RestaurantController.java
rc_path = os.path.join(rs_dir, r'controller\RestaurantController.java')
with open(rc_path, 'r', encoding='utf-8') as f:
    rc_content = f.read()

rc_content = rc_content.replace(
    'restaurantService.update(id, ownerId, request)',
    'restaurantService.update(id, ownerId, role, request)'
)
rc_content = rc_content.replace(
    'restaurantService.toggleOpen(id, ownerId)',
    'restaurantService.toggleOpen(id, ownerId, role)'
)
if '@RequestHeader(value = "X-User-Role", required = false) String role,' not in rc_content:
    rc_content = rc_content.replace(
        '@RequestHeader("X-User-Id") String ownerId,\n            @Valid @RequestBody RestaurantRequest request)',
        '@RequestHeader("X-User-Id") String ownerId,\n            @RequestHeader(value = "X-User-Role", required = false) String role,\n            @Valid @RequestBody RestaurantRequest request)'
    )
    rc_content = rc_content.replace(
        '@RequestHeader("X-User-Id") String ownerId)',
        '@RequestHeader("X-User-Id") String ownerId,\n            @RequestHeader(value = "X-User-Role", required = false) String role)'
    )

with open(rc_path, 'w', encoding='utf-8') as f:
    f.write(rc_content)
print("Updated RestaurantController.java")

# 4. Update MenuService.java
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
    MenuCategoryResponse addCategory(String restaurantId, String ownerId, String role, MenuCategoryRequest req);

    MenuItemResponse addItem(String restaurantId, String ownerId, MenuItemRequest req);
    MenuItemResponse addItem(String restaurantId, String ownerId, String role, MenuItemRequest req);

    MenuItemResponse updateItem(String itemId, String ownerId, MenuItemRequest req);
    MenuItemResponse updateItem(String itemId, String ownerId, String role, MenuItemRequest req);

    MenuItemResponse toggleAvailability(String itemId, String ownerId);
    MenuItemResponse toggleAvailability(String itemId, String ownerId, String role);

    MenuItemResponse toggleTodaysSpecial(String itemId, String ownerId);
    MenuItemResponse toggleTodaysSpecial(String itemId, String ownerId, String role);

    void deleteItem(String itemId, String ownerId);
    void deleteItem(String itemId, String ownerId, String role);
}
''')
print("Updated MenuService.java")

# 5. Update MenuServiceImpl.java
msi_path = os.path.join(rs_dir, r'service\MenuServiceImpl.java')
with open(msi_path, 'r', encoding='utf-8') as f:
    msi_content = f.read()

# Add overloads in MenuServiceImpl
overloads = '''
    @Override
    public MenuCategoryResponse addCategory(String restaurantId, String ownerId, MenuCategoryRequest req) {
        return addCategory(restaurantId, ownerId, null, req);
    }

    @Override
    public MenuItemResponse addItem(String restaurantId, String ownerId, MenuItemRequest req) {
        return addItem(restaurantId, ownerId, null, req);
    }

    @Override
    public MenuItemResponse updateItem(String itemId, String ownerId, MenuItemRequest req) {
        return updateItem(itemId, ownerId, null, req);
    }

    @Override
    public MenuItemResponse toggleAvailability(String itemId, String ownerId) {
        return toggleAvailability(itemId, ownerId, null);
    }

    @Override
    public MenuItemResponse toggleTodaysSpecial(String itemId, String ownerId) {
        return toggleTodaysSpecial(itemId, ownerId, null);
    }

    @Override
    public void deleteItem(String itemId, String ownerId) {
        deleteItem(itemId, ownerId, null);
    }
'''

if 'public MenuCategoryResponse addCategory(String restaurantId, String ownerId, String role, MenuCategoryRequest req)' not in msi_content:
    msi_content = msi_content.replace(
        'public MenuCategoryResponse addCategory(String restaurantId, String ownerId,\n                                             MenuCategoryRequest req) {\n        Restaurant r = getOwned(restaurantId, ownerId);',
        'public MenuCategoryResponse addCategory(String restaurantId, String ownerId, String role, MenuCategoryRequest req) {\n        Restaurant r = getOwned(restaurantId, ownerId, role);'
    )
    msi_content = msi_content.replace(
        'public MenuItemResponse addItem(String restaurantId, String ownerId,\n                                      MenuItemRequest req) {\n        Restaurant r = getOwned(restaurantId, ownerId);',
        'public MenuItemResponse addItem(String restaurantId, String ownerId, String role, MenuItemRequest req) {\n        Restaurant r = getOwned(restaurantId, ownerId, role);'
    )
    msi_content = msi_content.replace(
        'public MenuItemResponse updateItem(String itemId, String ownerId,\n                                       MenuItemRequest req) {\n        MenuItem item = getOwnedItem(itemId, ownerId);',
        'public MenuItemResponse updateItem(String itemId, String ownerId, String role, MenuItemRequest req) {\n        MenuItem item = getOwnedItem(itemId, ownerId, role);'
    )
    msi_content = msi_content.replace(
        'public MenuItemResponse toggleAvailability(String itemId, String ownerId) {\n        MenuItem item = getOwnedItem(itemId, ownerId);',
        'public MenuItemResponse toggleAvailability(String itemId, String ownerId, String role) {\n        MenuItem item = getOwnedItem(itemId, ownerId, role);'
    )
    msi_content = msi_content.replace(
        'public MenuItemResponse toggleTodaysSpecial(String itemId, String ownerId) {\n        MenuItem item = getOwnedItem(itemId, ownerId);',
        'public MenuItemResponse toggleTodaysSpecial(String itemId, String ownerId, String role) {\n        MenuItem item = getOwnedItem(itemId, ownerId, role);'
    )
    msi_content = msi_content.replace(
        'public void deleteItem(String itemId, String ownerId) {\n        MenuItem item = getOwnedItem(itemId, ownerId);',
        'public void deleteItem(String itemId, String ownerId, String role) {\n        MenuItem item = getOwnedItem(itemId, ownerId, role);'
    )

# Add overloaded methods implementation and getOwned with role
old_m_helpers = '''    private Restaurant getOwned(String restaurantId, String ownerId) {
        Restaurant r = restaurantRepo.findById(restaurantId).orElseThrow(() ->
                new ApiException("Restaurant not found",
                        HttpStatus.NOT_FOUND, "RESTAURANT_NOT_FOUND"));
        if (!r.getOwnerId().equals(ownerId))
            throw new ApiException("You do not own this restaurant",
                    HttpStatus.FORBIDDEN, "NOT_OWNER");
        return r;
    }

    private MenuItem getOwnedItem(String itemId, String ownerId) {
        MenuItem item = itemRepo.findById(itemId).orElseThrow(() ->
                new ApiException("Menu item not found",
                        HttpStatus.NOT_FOUND, "ITEM_NOT_FOUND"));
        if (!item.getRestaurant().getOwnerId().equals(ownerId))
            throw new ApiException("You do not own this restaurant",
                    HttpStatus.FORBIDDEN, "NOT_OWNER");
        return item;
    }'''

new_m_helpers = overloads + '''
    private Restaurant getOwned(String restaurantId, String ownerId) {
        return getOwned(restaurantId, ownerId, null);
    }

    private Restaurant getOwned(String restaurantId, String ownerId, String role) {
        Restaurant r = restaurantRepo.findById(restaurantId).orElseThrow(() ->
                new ApiException("Restaurant not found",
                        HttpStatus.NOT_FOUND, "RESTAURANT_NOT_FOUND"));
        boolean isAdminOrManager = role != null && (role.toUpperCase().contains("ADMIN") || role.toUpperCase().contains("MANAGER"));
        if (!isAdminOrManager && !r.getOwnerId().equals(ownerId))
            throw new ApiException("You do not own this restaurant",
                    HttpStatus.FORBIDDEN, "NOT_OWNER");
        return r;
    }

    private MenuItem getOwnedItem(String itemId, String ownerId) {
        return getOwnedItem(itemId, ownerId, null);
    }

    private MenuItem getOwnedItem(String itemId, String ownerId, String role) {
        MenuItem item = itemRepo.findById(itemId).orElseThrow(() ->
                new ApiException("Menu item not found",
                        HttpStatus.NOT_FOUND, "ITEM_NOT_FOUND"));
        boolean isAdminOrManager = role != null && (role.toUpperCase().contains("ADMIN") || role.toUpperCase().contains("MANAGER"));
        if (!isAdminOrManager && !item.getRestaurant().getOwnerId().equals(ownerId))
            throw new ApiException("You do not own this restaurant",
                    HttpStatus.FORBIDDEN, "NOT_OWNER");
        return item;
    }'''

msi_content = msi_content.replace(old_m_helpers, new_m_helpers)
with open(msi_path, 'w', encoding='utf-8') as f:
    f.write(msi_content)
print("Updated MenuServiceImpl.java")

# 6. Update MenuController.java
mc_path = os.path.join(rs_dir, r'controller\MenuController.java')
with open(mc_path, 'r', encoding='utf-8') as f:
    mc_content = f.read()

mc_content = mc_content.replace(
    'menuService.addCategory(restaurantId, ownerId, request)',
    'menuService.addCategory(restaurantId, ownerId, role, request)'
)
mc_content = mc_content.replace(
    'menuService.addItem(restaurantId, ownerId, request)',
    'menuService.addItem(restaurantId, ownerId, role, request)'
)
mc_content = mc_content.replace(
    'menuService.updateItem(itemId, ownerId, request)',
    'menuService.updateItem(itemId, ownerId, role, request)'
)
mc_content = mc_content.replace(
    'menuService.toggleAvailability(itemId, ownerId  )',
    'menuService.toggleAvailability(itemId, ownerId, role)'
)
mc_content = mc_content.replace(
    'menuService.toggleAvailability(itemId, ownerId)',
    'menuService.toggleAvailability(itemId, ownerId, role)'
)
mc_content = mc_content.replace(
    'menuService.toggleTodaysSpecial(itemId, ownerId)',
    'menuService.toggleTodaysSpecial(itemId, ownerId, role)'
)

with open(mc_path, 'w', encoding='utf-8') as f:
    f.write(mc_content)
print("Updated MenuController.java")

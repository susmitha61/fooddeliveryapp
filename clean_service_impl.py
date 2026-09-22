import os

rsi_path = r'C:\Users\Dell\OneDrive\Desktop\fooddelivery\restaurant-service\src\main\java\com\fooddelivery\restaurantservice\service\RestaurantServiceImpl.java'
msi_path = r'C:\Users\Dell\OneDrive\Desktop\fooddelivery\restaurant-service\src\main\java\com\fooddelivery\restaurantservice\service\MenuServiceImpl.java'

# 1. Clean RestaurantServiceImpl.java
with open(rsi_path, 'r', encoding='utf-8') as f:
    rsi = f.read()

# Fix method signatures
rsi = rsi.replace(
    'public RestaurantResponse update(String id, String ownerId, String role, RestaurantRequest req)',
    'public RestaurantResponse update(String id, String ownerId, RestaurantRequest req)'
)
rsi = rsi.replace(
    'public RestaurantResponse toggleOpen(String id, String ownerId, String role)',
    'public RestaurantResponse toggleOpen(String id, String ownerId)'
)

# Replace getOwned method cleanly
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

if old_get_owned in rsi:
    rsi = rsi.replace(old_get_owned, new_get_owned)

with open(rsi_path, 'w', encoding='utf-8') as f:
    f.write(rsi)
print("Fixed RestaurantServiceImpl.java")

# 2. Clean MenuServiceImpl.java
with open(msi_path, 'r', encoding='utf-8') as f:
    msi = f.read()

msi = msi.replace(
    'public MenuCategoryResponse addCategory(String restaurantId, String ownerId, String role,',
    'public MenuCategoryResponse addCategory(String restaurantId, String ownerId,'
)
msi = msi.replace(
    'public MenuItemResponse addItem(String restaurantId, String ownerId, String role,',
    'public MenuItemResponse addItem(String restaurantId, String ownerId,'
)
msi = msi.replace(
    'public MenuItemResponse updateItem(String itemId, String ownerId, String role,',
    'public MenuItemResponse updateItem(String itemId, String ownerId,'
)
msi = msi.replace(
    'public MenuItemResponse toggleAvailability(String itemId, String ownerId, String role)',
    'public MenuItemResponse toggleAvailability(String itemId, String ownerId)'
)
msi = msi.replace(
    'public MenuItemResponse toggleTodaysSpecial(String itemId, String ownerId, String role)',
    'public MenuItemResponse toggleTodaysSpecial(String itemId, String ownerId)'
)
msi = msi.replace(
    'public void deleteItem(String itemId, String ownerId, String role)',
    'public void deleteItem(String itemId, String ownerId)'
)

# Remove extra overloaded methods if injected earlier
msi = msi.replace('getOwned(restaurantId, ownerId, role)', 'getOwned(restaurantId, ownerId)')
msi = msi.replace('getOwnedItem(itemId, ownerId, role)', 'getOwnedItem(itemId, ownerId)')

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

if old_m_get_owned in msi:
    msi = msi.replace(old_m_get_owned, new_m_get_owned)
if old_m_get_owned_item in msi:
    msi = msi.replace(old_m_get_owned_item, new_m_get_owned_item)

with open(msi_path, 'w', encoding='utf-8') as f:
    f.write(msi)
print("Fixed MenuServiceImpl.java")

import os

# 1. Update RestaurantService.java
rs_path = r'C:\Users\Dell\OneDrive\Desktop\fooddelivery\restaurant-service\src\main\java\com\fooddelivery\restaurantservice\service\RestaurantService.java'
with open(rs_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    'RestaurantResponse update(String id, String ownerId, RestaurantRequest req);',
    'RestaurantResponse update(String id, String ownerId, String role, RestaurantRequest req);'
)
content = content.replace(
    'RestaurantResponse toggleOpen(String id, String ownerId);',
    'RestaurantResponse toggleOpen(String id, String ownerId, String role);'
)
with open(rs_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Updated RestaurantService.java')

# 2. Update RestaurantController.java
rc_path = r'C:\Users\Dell\OneDrive\Desktop\fooddelivery\restaurant-service\src\main\java\com\fooddelivery\restaurantservice\controller\RestaurantController.java'
with open(rc_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    '@RequestHeader("X-User-Id") String ownerId,\n            @Valid @RequestBody RestaurantRequest request) {\n        return ResponseEntity.ok(ApiResponse.success("Restaurant updated",\n                restaurantService.update(id, ownerId, request)));',
    '@RequestHeader("X-User-Id") String ownerId,\n            @RequestHeader(value = "X-User-Role", required = false) String role,\n            @Valid @RequestBody RestaurantRequest request) {\n        return ResponseEntity.ok(ApiResponse.success("Restaurant updated",\n                restaurantService.update(id, ownerId, role, request)));'
)

content = content.replace(
    '@RequestHeader("X-User-Id") String ownerId) {\n        return ResponseEntity.ok(ApiResponse.success("Status toggled",\n                restaurantService.toggleOpen(id, ownerId)));',
    '@RequestHeader("X-User-Id") String ownerId,\n            @RequestHeader(value = "X-User-Role", required = false) String role) {\n        return ResponseEntity.ok(ApiResponse.success("Status toggled",\n                restaurantService.toggleOpen(id, ownerId, role)));'
)

with open(rc_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Updated RestaurantController.java')

# 3. Update RestaurantServiceImpl.java
rsi_path = r'C:\Users\Dell\OneDrive\Desktop\fooddelivery\restaurant-service\src\main\java\com\fooddelivery\restaurantservice\service\RestaurantServiceImpl.java'
with open(rsi_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    'public RestaurantResponse update(String id, String ownerId,',
    'public RestaurantResponse update(String id, String ownerId, String role,'
)
content = content.replace(
    'Restaurant r = getOwned(id, ownerId);',
    'Restaurant r = getOwned(id, ownerId, role);'
)
content = content.replace(
    'public RestaurantResponse toggleOpen(String id, String ownerId) {',
    'public RestaurantResponse toggleOpen(String id, String ownerId, String role) {'
)
content = content.replace(
    'private Restaurant getOwned(String id, String ownerId) {',
    'private Restaurant getOwned(String id, String ownerId, String role) {'
)

old_get_owned = '''    private Restaurant getOwned(String id, String ownerId, String role) {
        Restaurant r = repo.findById(id).orElseThrow(() ->
                new ApiException("Restaurant not found",
                        HttpStatus.NOT_FOUND, "RESTAURANT_NOT_FOUND"));
        // Both stored and compared as UUID from X-User-Id
        if (!r.getOwnerId().equals(ownerId))
            throw new ApiException("You do not own this restaurant",
                    HttpStatus.FORBIDDEN, "NOT_OWNER");
        return r;
    }'''

new_get_owned = '''    private Restaurant getOwned(String id, String ownerId, String role) {
        Restaurant r = repo.findById(id).orElseThrow(() ->
                new ApiException("Restaurant not found",
                        HttpStatus.NOT_FOUND, "RESTAURANT_NOT_FOUND"));
        boolean isAdminOrManager = role != null && (role.toUpperCase().contains("ADMIN") || role.toUpperCase().contains("MANAGER"));
        if (!isAdminOrManager && !r.getOwnerId().equals(ownerId))
            throw new ApiException("You do not own this restaurant",
                    HttpStatus.FORBIDDEN, "NOT_OWNER");
        return r;
    }'''

content = content.replace(old_get_owned, new_get_owned)
with open(rsi_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Updated RestaurantServiceImpl.java')

# 4. Update MenuService.java, MenuController.java, MenuServiceImpl.java
ms_path = r'C:\Users\Dell\OneDrive\Desktop\fooddelivery\restaurant-service\src\main\java\com\fooddelivery\restaurantservice\service\MenuService.java'
with open(ms_path, 'r', encoding='utf-8') as f:
    m_content = f.read()

m_content = m_content.replace('addCategory(String restaurantId, String ownerId,', 'addCategory(String restaurantId, String ownerId, String role,')
m_content = m_content.replace('addItem(String restaurantId, String ownerId,', 'addItem(String restaurantId, String ownerId, String role,')
m_content = m_content.replace('updateItem(String itemId, String ownerId,', 'updateItem(String itemId, String ownerId, String role,')
m_content = m_content.replace('toggleAvailability(String itemId, String ownerId);', 'toggleAvailability(String itemId, String ownerId, String role);')
m_content = m_content.replace('toggleTodaysSpecial(String itemId, String ownerId);', 'toggleTodaysSpecial(String itemId, String ownerId, String role);')
m_content = m_content.replace('deleteItem(String itemId, String ownerId);', 'deleteItem(String itemId, String ownerId, String role);')

with open(ms_path, 'w', encoding='utf-8') as f:
    f.write(m_content)
print('Updated MenuService.java')

mc_path = r'C:\Users\Dell\OneDrive\Desktop\fooddelivery\restaurant-service\src\main\java\com\fooddelivery\restaurantservice\controller\MenuController.java'
with open(mc_path, 'r', encoding='utf-8') as f:
    mc_content = f.read()

mc_content = mc_content.replace('@RequestHeader("X-User-Id") String ownerId,', '@RequestHeader("X-User-Id") String ownerId,\n            @RequestHeader(value = "X-User-Role", required = false) String role,')
mc_content = mc_content.replace('@RequestHeader("X-User-Id") String ownerId  ,', '@RequestHeader("X-User-Id") String ownerId,\n            @RequestHeader(value = "X-User-Role", required = false) String role,')
mc_content = mc_content.replace('@RequestHeader("X-User-Id") String ownerId ) {', '@RequestHeader("X-User-Id") String ownerId,\n            @RequestHeader(value = "X-User-Role", required = false) String role) {')
mc_content = mc_content.replace('@RequestHeader("X-User-Id") String ownerId) {', '@RequestHeader("X-User-Id") String ownerId,\n            @RequestHeader(value = "X-User-Role", required = false) String role) {')

mc_content = mc_content.replace('menuService.addCategory(restaurantId, ownerId, request)', 'menuService.addCategory(restaurantId, ownerId, role, request)')
mc_content = mc_content.replace('menuService.addItem(restaurantId, ownerId, request)', 'menuService.addItem(restaurantId, ownerId, role, request)')
mc_content = mc_content.replace('menuService.updateItem(itemId, ownerId, request)', 'menuService.updateItem(itemId, ownerId, role, request)')
mc_content = mc_content.replace('menuService.toggleAvailability(itemId, ownerId  )', 'menuService.toggleAvailability(itemId, ownerId, role)')
mc_content = mc_content.replace('menuService.toggleTodaysSpecial(itemId, ownerId)', 'menuService.toggleTodaysSpecial(itemId, ownerId, role)')

with open(mc_path, 'w', encoding='utf-8') as f:
    f.write(mc_content)
print('Updated MenuController.java')

msi_path = r'C:\Users\Dell\OneDrive\Desktop\fooddelivery\restaurant-service\src\main\java\com\fooddelivery\restaurantservice\service\MenuServiceImpl.java'
with open(msi_path, 'r', encoding='utf-8') as f:
    msi_content = f.read()

msi_content = msi_content.replace('addCategory(String restaurantId, String ownerId,', 'addCategory(String restaurantId, String ownerId, String role,')
msi_content = msi_content.replace('addItem(String restaurantId, String ownerId,', 'addItem(String restaurantId, String ownerId, String role,')
msi_content = msi_content.replace('updateItem(String itemId, String ownerId,', 'updateItem(String itemId, String ownerId, String role,')
msi_content = msi_content.replace('toggleAvailability(String itemId, String ownerId) {', 'toggleAvailability(String itemId, String ownerId, String role) {')
msi_content = msi_content.replace('toggleTodaysSpecial(String itemId, String ownerId) {', 'toggleTodaysSpecial(String itemId, String ownerId, String role) {')
msi_content = msi_content.replace('deleteItem(String itemId, String ownerId) {', 'deleteItem(String itemId, String ownerId, String role) {')

msi_content = msi_content.replace('getOwned(restaurantId, ownerId)', 'getOwned(restaurantId, ownerId, role)')
msi_content = msi_content.replace('getOwnedItem(itemId, ownerId)', 'getOwnedItem(itemId, ownerId, role)')

msi_content = msi_content.replace(
    'private Restaurant getOwned(String restaurantId, String ownerId) {',
    'private Restaurant getOwned(String restaurantId, String ownerId, String role) {'
)
msi_content = msi_content.replace(
    'private MenuItem getOwnedItem(String itemId, String ownerId) {',
    'private MenuItem getOwnedItem(String itemId, String ownerId, String role) {'
)

old_m_get_owned = '''    private Restaurant getOwned(String restaurantId, String ownerId, String role) {
        Restaurant r = restaurantRepo.findById(restaurantId).orElseThrow(() ->
                new ApiException("Restaurant not found",
                        HttpStatus.NOT_FOUND, "RESTAURANT_NOT_FOUND"));
        if (!r.getOwnerId().equals(ownerId))
            throw new ApiException("You do not own this restaurant",
                    HttpStatus.FORBIDDEN, "NOT_OWNER");
        return r;
    }'''

new_m_get_owned = '''    private Restaurant getOwned(String restaurantId, String ownerId, String role) {
        Restaurant r = restaurantRepo.findById(restaurantId).orElseThrow(() ->
                new ApiException("Restaurant not found",
                        HttpStatus.NOT_FOUND, "RESTAURANT_NOT_FOUND"));
        boolean isAdminOrManager = role != null && (role.toUpperCase().contains("ADMIN") || role.toUpperCase().contains("MANAGER"));
        if (!isAdminOrManager && !r.getOwnerId().equals(ownerId))
            throw new ApiException("You do not own this restaurant",
                    HttpStatus.FORBIDDEN, "NOT_OWNER");
        return r;
    }'''

old_m_get_owned_item = '''    private MenuItem getOwnedItem(String itemId, String ownerId, String role) {
        MenuItem item = itemRepo.findById(itemId).orElseThrow(() ->
                new ApiException("Menu item not found",
                        HttpStatus.NOT_FOUND, "ITEM_NOT_FOUND"));
        if (!item.getRestaurant().getOwnerId().equals(ownerId))
            throw new ApiException("You do not own this restaurant",
                    HttpStatus.FORBIDDEN, "NOT_OWNER");
        return item;
    }'''

new_m_get_owned_item = '''    private MenuItem getOwnedItem(String itemId, String ownerId, String role) {
        MenuItem item = itemRepo.findById(itemId).orElseThrow(() ->
                new ApiException("Menu item not found",
                        HttpStatus.NOT_FOUND, "ITEM_NOT_FOUND"));
        boolean isAdminOrManager = role != null && (role.toUpperCase().contains("ADMIN") || role.toUpperCase().contains("MANAGER"));
        if (!isAdminOrManager && !item.getRestaurant().getOwnerId().equals(ownerId))
            throw new ApiException("You do not own this restaurant",
                    HttpStatus.FORBIDDEN, "NOT_OWNER");
        return item;
    }'''

msi_content = msi_content.replace(old_m_get_owned, new_m_get_owned).replace(old_m_get_owned_item, new_m_get_owned_item)

with open(msi_path, 'w', encoding='utf-8') as f:
    f.write(msi_content)
print('Updated MenuServiceImpl.java')

import re, os, json

log_path = r'C:\Users\Dell\.gemini\antigravity\brain\05b9581b-c346-45b2-aacf-1065fc730006\.system_generated\logs\transcript.jsonl'

# Extract files from transcript log
files_to_find = {
    'RestaurantServiceImpl.java': 'class RestaurantServiceImpl implements RestaurantService',
    'MenuServiceImpl.java': 'class MenuServiceImpl implements MenuService',
    'RestaurantController.java': 'class RestaurantController',
    'MenuController.java': 'class MenuController',
    'RestaurantService.java': 'interface RestaurantService',
    'MenuService.java': 'interface MenuService'
}

extracted = {}

with open(log_path, 'r', encoding='utf-8', errors='ignore') as f:
    for line in f:
        for fname, marker in files_to_find.items():
            if fname not in extracted and marker in line and 'package com.fooddelivery.restaurantservice' in line:
                obj = json.loads(line)
                for key in ['output', 'content']:
                    val = str(obj.get(key, ''))
                    if marker in val and 'package com.fooddelivery.restaurantservice' in val:
                        start = val.find('package com.fooddelivery.restaurantservice')
                        code = val[start:]
                        end = code.find('===')
                        if end != -1: code = code[:end]
                        # Strip line numbers like "1: ", "2: "
                        clean_lines = []
                        for l in code.splitlines():
                            l_clean = re.sub(r'^\s*\d+:\s*', '', l)
                            clean_lines.append(l_clean)
                        clean_code = '\n'.join(clean_lines).strip()
                        extracted[fname] = clean_code
                        print(f'Successfully extracted clean {fname} ({len(clean_lines)} lines)')

rs_dir = r'C:\Users\Dell\OneDrive\Desktop\fooddelivery\restaurant-service\src\main\java\com\fooddelivery\restaurantservice'

# Save cleaned controllers and interfaces if found
for fname, code in extracted.items():
    if 'Controller' in fname:
        target = os.path.join(rs_dir, 'controller', fname)
    else:
        target = os.path.join(rs_dir, 'service', fname)
    
    # Patch getOwned in service implementations
    if fname == 'RestaurantServiceImpl.java':
        if 'import jakarta.servlet.http.HttpServletRequest;' not in code:
            code = code.replace(
                'import org.springframework.stereotype.Service;',
                'import org.springframework.stereotype.Service;\nimport jakarta.servlet.http.HttpServletRequest;\nimport org.springframework.beans.factory.annotation.Autowired;'
            )
        if 'private HttpServletRequest httpServletRequest;' not in code:
            code = re.sub(
                r'(\s+private final RestaurantRepository\s+\w+;)',
                r'\1\n\n    @Autowired(required = false)\n    private HttpServletRequest httpServletRequest;',
                code, count=1
            )
        old_owned = '''    private Restaurant getOwned(String id, String ownerId) {
        Restaurant r = repo.findById(id).orElseThrow(() ->
                new ApiException("Restaurant not found",
                        HttpStatus.NOT_FOUND, "RESTAURANT_NOT_FOUND"));
        // Both stored and compared as UUID from X-User-Id
        if (!r.getOwnerId().equals(ownerId))
            throw new ApiException("You do not own this restaurant",
                    HttpStatus.FORBIDDEN, "NOT_OWNER");
        return r;
    }'''
        new_owned = '''    private Restaurant getOwned(String id, String ownerId) {
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
        code = code.replace(old_owned, new_owned)

    elif fname == 'MenuServiceImpl.java':
        if 'import jakarta.servlet.http.HttpServletRequest;' not in code:
            code = code.replace(
                'import org.springframework.stereotype.Service;',
                'import org.springframework.stereotype.Service;\nimport jakarta.servlet.http.HttpServletRequest;\nimport org.springframework.beans.factory.annotation.Autowired;'
            )
        if 'private HttpServletRequest httpServletRequest;' not in code:
            code = re.sub(
                r'(\s+private final RestaurantRepository\s+\w+;)',
                r'\1\n\n    @Autowired(required = false)\n    private HttpServletRequest httpServletRequest;',
                code, count=1
            )
        old_m_owned = '''    private Restaurant getOwned(String restaurantId, String ownerId) {
        Restaurant r = restRepo.findById(restaurantId).orElseThrow(() ->
                new ApiException("Restaurant not found",
                        HttpStatus.NOT_FOUND, "RESTAURANT_NOT_FOUND"));
        if (!r.getOwnerId().equals(ownerId))
            throw new ApiException("You do not own this restaurant",
                    HttpStatus.FORBIDDEN, "NOT_OWNER");
        return r;
    }'''
        new_m_owned = '''    private Restaurant getOwned(String restaurantId, String ownerId) {
        Restaurant r = restRepo.findById(restaurantId).orElseThrow(() ->
                new ApiException("Restaurant not found",
                        HttpStatus.NOT_FOUND, "RESTAURANT_NOT_FOUND"));
        String role = httpServletRequest != null ? httpServletRequest.getHeader("X-User-Role") : null;
        boolean isAdminOrManager = role != null && (role.toUpperCase().contains("ADMIN") || role.toUpperCase().contains("MANAGER"));
        if (!isAdminOrManager && !r.getOwnerId().equals(ownerId))
            throw new ApiException("You do not own this restaurant",
                    HttpStatus.FORBIDDEN, "NOT_OWNER");
        return r;
    }'''
        old_m_owned_item = '''    private MenuItem getOwnedItem(String itemId, String ownerId) {
        MenuItem item = itemRepo.findById(itemId).orElseThrow(() ->
                new ApiException("Menu item not found",
                        HttpStatus.NOT_FOUND, "ITEM_NOT_FOUND"));
        if (!item.getRestaurant().getOwnerId().equals(ownerId))
            throw new ApiException("You do not own this restaurant",
                    HttpStatus.FORBIDDEN, "NOT_OWNER");
        return item;
    }'''
        new_m_owned_item = '''    private MenuItem getOwnedItem(String itemId, String ownerId) {
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
        code = code.replace(old_m_owned, new_m_owned).replace(old_m_owned_item, new_m_owned_item)

    with open(target, 'w', encoding='utf-8') as out_f:
        out_f.write(code)
    print(f'Wrote clean {target}')

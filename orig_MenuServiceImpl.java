package com.fooddelivery.restaurantservice.service;
2: 
3: import com.fooddelivery.restaurantservice.dto.*;
4: import com.fooddelivery.restaurantservice.entity.*;
5: import com.fooddelivery.restaurantservice.exception.ApiException;
6: import com.fooddelivery.restaurantservice.repository.*;
7: import lombok.RequiredArgsConstructor;
8: import lombok.extern.slf4j.Slf4j;
9: import org.springframework.data.domain.PageRequest;
10: import org.springframework.http.HttpStatus;
11: import org.springframework.stereotype.Service;
12: import org.springframework.transaction.annotation.Transactional;
13: import java.util.List;
14: import java.util.stream.Collectors;
15: 
16: @Service
17: @RequiredArgsConstructor
18: @Slf4j
19: @Transactional
20: public class MenuServiceImpl implements MenuService {
21: 
22:     private final MenuItemRepository     itemRepo;
23:     private final MenuCategoryRepository catRepo;
24:     private final RestaurantRepository   restRepo;
25: 
26:     // ── Categories ─────────────────────────────────────────
27: 
28:     @Override
29:     public MenuCategoryResponse addCategory(String restaurantId,
30:                                              String ownerId,
31:                                              MenuCategoryRequest req) {
32:         Restaurant r = getOwned(restaurantId, ownerId);
33:         MenuCategory cat = MenuCategory.builder()
34:         
<truncated 12596 bytes>
  return item;
292:     }
293: 
294:     private boolean bool(Boolean b) {
295:         return Boolean.TRUE.equals(b);
296:     }
297: 
298:     private boolean bool(Boolean b, boolean def) {
299:         return b != null ? b : def;
300:     }
301: 
302:     // ── Add these two methods to MenuServiceImpl ───────────
303: 
304:         @Override
305:         @Transactional(readOnly = true)
306:         public List<MenuItemResponse> searchDishes(String keyword, int limit) {
307:         if (keyword == null || keyword.isBlank())
308:                 throw new ApiException("Search keyword is required",
309:                         HttpStatus.BAD_REQUEST, "KEYWORD_REQUIRED");
310: 
311:         return itemRepo.searchByDishName(keyword.trim(),
312:                 PageRequest.of(0, limit))
313:                 .stream()
314:                 .map(MenuItemResponse::from)
315:                 .collect(Collectors.toList());
316:         }
317: 
318:         @Override
319:         @Transactional(readOnly = true)
320:         public List<MenuItemResponse> searchDishesInRestaurant(String restaurantId,
321:                                                                 String keyword) {
322:         if (keyword == null || keyword.isBlank())
323:                 throw new ApiException("Search keyword is required",
324:                         HttpStatus.BAD_REQUEST, "KEYWORD_REQUIRED");
325: 
326:         // Verify restaurant exists
327:         restRepo.findById(restaurantId)
328:                 .orElseThrow(() -> new ApiException("Restaurant not found",
329:                         HttpStatus.NOT_FOUND, "RESTAURANT_NOT_FOUND"));
330: 
331:         return itemRepo.searchByDishNameInRestaurant(restaurantId, keyword.trim())
332:                 .stream()
333:                 .map(MenuItemResponse::from)
334:                 .collect(Collectors.toList());
335:         }
336: }
The above content shows the entire, complete file contents of the requested file.
package com.fooddelivery.restaurantservice.controller;

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

    @PatchMapping("/{id}/assign-manager")
    @Operation(summary = "Assign manager to restaurant (OWNER/ADMIN)")
    public ResponseEntity<ApiResponse<RestaurantResponse>> assignManager(
            @PathVariable String id,
            @RequestParam String managerId,
            @RequestHeader("X-User-Id") String callerId) {
        return ResponseEntity.ok(ApiResponse.success("Manager assigned successfully",
                restaurantService.assignManager(id, managerId, callerId)));
    }

    @PatchMapping("/{id}/unassign-manager")
    @Operation(summary = "Unassign manager from restaurant (OWNER/ADMIN)")
    public ResponseEntity<ApiResponse<RestaurantResponse>> unassignManager(
            @PathVariable String id,
            @RequestParam String managerId,
            @RequestHeader("X-User-Id") String callerId) {
        return ResponseEntity.ok(ApiResponse.success("Manager unassigned successfully",
                restaurantService.unassignManager(id, managerId, callerId)));
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

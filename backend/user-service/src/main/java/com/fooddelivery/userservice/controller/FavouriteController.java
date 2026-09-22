package com.fooddelivery.userservice.controller;

import com.fooddelivery.userservice.dto.*;
import com.fooddelivery.userservice.entity.Favourite;
import com.fooddelivery.userservice.service.FavouriteService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/favourites")
@RequiredArgsConstructor
@Tag(name = "Favourites", description = "BRD UC8 — Save Favourite Restaurants")
public class FavouriteController {

    private final FavouriteService favouriteService;

    @PostMapping("/users/{userId}")
    @Operation(summary = "Add to favourites (UC8)")
    public ResponseEntity<ApiResponse<Favourite>> addFavourite(
            @PathVariable String userId,
            @Valid @RequestBody FavouriteRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Added to favourites",
                        favouriteService.addFavourite(userId, request)));
    }

    @GetMapping("/users/{userId}")
    @Operation(summary = "Get favourites (UC8)")
    public ResponseEntity<ApiResponse<List<Favourite>>> getFavourites(
            @PathVariable String userId) {
        return ResponseEntity.ok(
                ApiResponse.success(favouriteService.getFavourites(userId)));
    }

    @DeleteMapping("/users/{userId}/restaurants/{restaurantId}")
    @Operation(summary = "Remove from favourites (UC8)")
    public ResponseEntity<ApiResponse<Void>> removeFavourite(
            @PathVariable String userId,
            @PathVariable String restaurantId) {
        favouriteService.removeFavourite(userId, restaurantId);
        return ResponseEntity.ok(
                ApiResponse.success("Removed from favourites", null));
    }

    @GetMapping("/users/{userId}/restaurants/{restaurantId}/check")
    @Operation(summary = "Check if favourited (UC8)")
    public ResponseEntity<ApiResponse<Boolean>> checkFavourite(
            @PathVariable String userId,
            @PathVariable String restaurantId) {
        return ResponseEntity.ok(
                ApiResponse.success(
                        favouriteService.isFavourite(userId, restaurantId)));
    }
}
package com.fooddelivery.supportservice.controller;

import com.fooddelivery.supportservice.dto.ApiResponse;
import com.fooddelivery.supportservice.dto.review.*;
import com.fooddelivery.supportservice.service.ReviewService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/reviews")
@RequiredArgsConstructor
@Tag(name = "Reviews", description = "Restaurant and menu item reviews")
public class ReviewController {

    private final ReviewService reviewService;

    @PostMapping
    @Operation(summary = "Submit review — validates user, restaurant, menu item, category")
    public ResponseEntity<ApiResponse<ReviewResponse>> submit(
            @RequestHeader("X-User-Id") String userId,
            @Valid @RequestBody ReviewRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Review submitted",
                        reviewService.submit(userId, request)));
    }

    @GetMapping("/restaurant/{restaurantId}")
    @Operation(summary = "Get all reviews for a restaurant")
    public ResponseEntity<ApiResponse<Page<ReviewResponse>>> restaurantReviews(
            @PathVariable String restaurantId,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success(
                reviewService.getRestaurantReviews(restaurantId, page, size)));
    }

    @GetMapping("/menu-item/{menuItemId}")
    @Operation(summary = "Get all reviews for a menu item")
    public ResponseEntity<ApiResponse<Page<ReviewResponse>>> menuItemReviews(
            @PathVariable String menuItemId,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success(
                reviewService.getMenuItemReviews(menuItemId, page, size)));
    }

    @GetMapping("/my-reviews")
    @Operation(summary = "Get my reviews")
    public ResponseEntity<ApiResponse<Page<ReviewResponse>>> myReviews(
            @RequestHeader("X-User-Id") String userId,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success(
                reviewService.getMyReviews(userId, page, size)));
    }

    @GetMapping("/{reviewId}")
    @Operation(summary = "Get review by ID")
    public ResponseEntity<ApiResponse<ReviewResponse>> getById(
            @PathVariable String reviewId) {
        return ResponseEntity.ok(
                ApiResponse.success(reviewService.getById(reviewId)));
    }

    @GetMapping("/restaurant/{restaurantId}/summary")
    @Operation(summary = "Rating summary for a restaurant")
    public ResponseEntity<ApiResponse<RatingSummary>> restaurantSummary(
            @PathVariable String restaurantId) {
        return ResponseEntity.ok(ApiResponse.success(
                reviewService.restaurantSummary(restaurantId)));
    }

    @GetMapping("/menu-item/{menuItemId}/summary")
    @Operation(summary = "Rating summary for a menu item")
    public ResponseEntity<ApiResponse<RatingSummary>> menuItemSummary(
            @PathVariable String menuItemId) {
        return ResponseEntity.ok(ApiResponse.success(
                reviewService.menuItemSummary(menuItemId)));
    }

    @PutMapping("/{reviewId}")
    @Operation(summary = "Update own review")
    public ResponseEntity<ApiResponse<ReviewResponse>> update(
            @PathVariable String reviewId,
            @RequestHeader("X-User-Id") String userId,
            @Valid @RequestBody ReviewRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Review updated",
                reviewService.update(reviewId, userId, request)));
    }

    @DeleteMapping("/{reviewId}")
    @Operation(summary = "Delete own review")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable String reviewId,
            @RequestHeader("X-User-Id") String userId) {
        reviewService.delete(reviewId, userId);
        return ResponseEntity.ok(ApiResponse.success("Review deleted", null));
    }

    @PatchMapping("/{reviewId}/hide")
    @Operation(summary = "Hide review — ADMIN")
    public ResponseEntity<ApiResponse<ReviewResponse>> hide(
            @PathVariable String reviewId,
            @RequestHeader("X-User-Id") String adminId) {
        return ResponseEntity.ok(ApiResponse.success("Review hidden",
                reviewService.hide(reviewId, adminId)));
    }
}
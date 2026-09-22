package com.fooddelivery.supportservice.service;

import com.fooddelivery.supportservice.dto.review.*;
import org.springframework.data.domain.Page;

public interface ReviewService {
    ReviewResponse   submit(String userId, ReviewRequest request);
    Page<ReviewResponse> getRestaurantReviews(String restaurantId, int page, int size);
    Page<ReviewResponse> getMenuItemReviews(String menuItemId, int page, int size);
    Page<ReviewResponse> getMyReviews(String userId, int page, int size);
    ReviewResponse   getById(String reviewId);
    ReviewResponse   update(String reviewId, String userId, ReviewRequest request);
    void             delete(String reviewId, String userId);
    RatingSummary    restaurantSummary(String restaurantId);
    RatingSummary    menuItemSummary(String menuItemId);
    ReviewResponse   hide(String reviewId, String adminId);
}
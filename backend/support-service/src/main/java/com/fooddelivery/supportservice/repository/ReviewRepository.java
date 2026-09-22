package com.fooddelivery.supportservice.repository;

import com.fooddelivery.supportservice.entity.Review;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, String> {

    // Duplicate check
    boolean existsByUserIdAndOrderIdAndReviewType(
            String userId, String orderId, Review.ReviewType type);

    // Restaurant reviews
    Page<Review> findByRestaurantIdAndReviewTypeAndIsVisibleTrue(
            String restaurantId, Review.ReviewType type, Pageable pageable);

    // Menu item reviews
    Page<Review> findByMenuItemIdAndIsVisibleTrue(
            String menuItemId, Pageable pageable);

    // User's own reviews
    Page<Review> findByUserIdOrderByCreatedAtDesc(
            String userId, Pageable pageable);

    // Own review — for update/delete
    Optional<Review> findByIdAndUserId(String id, String userId);

    // Average ratings
    @Query("SELECT COALESCE(AVG(r.rating), 0) FROM Review r " +
           "WHERE r.restaurantId = :id AND r.reviewType = 'RESTAURANT' " +
           "AND r.isVisible = true")
    Double avgRestaurantRating(@Param("id") String restaurantId);

    @Query("SELECT COALESCE(AVG(r.rating), 0) FROM Review r " +
           "WHERE r.menuItemId = :id AND r.reviewType = 'MENU_ITEM' " +
           "AND r.isVisible = true")
    Double avgMenuItemRating(@Param("id") String menuItemId);

    // Rating breakdown
    @Query("SELECT r.rating, COUNT(r) FROM Review r " +
           "WHERE r.restaurantId = :id AND r.reviewType = 'RESTAURANT' " +
           "AND r.isVisible = true GROUP BY r.rating")
    List<Object[]> ratingBreakdownRestaurant(@Param("id") String restaurantId);

    @Query("SELECT r.rating, COUNT(r) FROM Review r " +
           "WHERE r.menuItemId = :id AND r.reviewType = 'MENU_ITEM' " +
           "AND r.isVisible = true GROUP BY r.rating")
    List<Object[]> ratingBreakdownMenuItem(@Param("id") String menuItemId);

    // Counts
    long countByRestaurantIdAndReviewTypeAndIsVisibleTrue(
            String restaurantId, Review.ReviewType type);

    long countByMenuItemIdAndIsVisibleTrue(String menuItemId);
}
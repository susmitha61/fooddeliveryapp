package com.fooddelivery.supportservice.service;

import com.fooddelivery.supportservice.client.*;
import com.fooddelivery.supportservice.dto.review.*;
import com.fooddelivery.supportservice.entity.Review;
import com.fooddelivery.supportservice.exception.ApiException;
import com.fooddelivery.supportservice.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository        reviewRepo;
    private final AuthServiceClient       authClient;
    private final UserServiceClient       userClient;
    private final RestaurantServiceClient restaurantClient;

    // ── Submit ─────────────────────────────────────────────

    @Override
    public ReviewResponse submit(String userId, ReviewRequest req) {

        // 1. Validate user in auth-service AND user-service
        validateUser(userId);

        // 2. Prevent duplicate review for same order + type
        if (reviewRepo.existsByUserIdAndOrderIdAndReviewType(
                userId, req.getOrderId(), req.getReviewType()))
            throw new ApiException(
                    "You already reviewed this " +
                    req.getReviewType().name().toLowerCase() +
                    " for this order",
                    HttpStatus.CONFLICT, "DUPLICATE_REVIEW");

        // 3. Validate restaurant exists in restaurant-service DB
        Map<String, Object> restaurantData =
                validateRestaurantExists(req.getRestaurantId());
        String restaurantName = extract(restaurantData, "data", "name");

        // 4. For MENU_ITEM — validate item + category exist
        String menuItemName = null;
        String categoryId   = null;
        String categoryName = null;

        if (req.getReviewType() == Review.ReviewType.MENU_ITEM) {
            if (req.getMenuItemId() == null || req.getMenuItemId().isBlank())
                throw new ApiException(
                        "menuItemId is required for MENU_ITEM review",
                        HttpStatus.BAD_REQUEST, "MENU_ITEM_ID_REQUIRED");

            // Validate item exists in restaurant-service DB
            // + verify it belongs to correct restaurant
            // + verify category exists (returned in item data)
            Map<String, Object> itemData = validateMenuItemExists(
                    req.getRestaurantId(), req.getMenuItemId());

            menuItemName = extract(itemData, "data", "name");
            categoryId   = extract(itemData, "data", "categoryId");
            categoryName = extract(itemData, "data", "categoryName");

            // Hard-fail if category doesn't exist
            if (categoryId == null)
                throw new ApiException(
                        "Menu item has no valid category assigned",
                        HttpStatus.BAD_REQUEST, "CATEGORY_NOT_FOUND");
        }

        // 5. Fetch user display name
        String userName = fetchUserName(userId);

        // 6. Build and persist
        Review review = Review.builder()
                .userId(userId)
                .userName(userName)
                .reviewType(req.getReviewType())
                .restaurantId(req.getRestaurantId())
                .restaurantName(restaurantName)
                .menuItemId(req.getMenuItemId())
                .menuItemName(menuItemName)
                .categoryId(categoryId)
                .categoryName(categoryName)
                .orderId(req.getOrderId())
                .rating(req.getRating())
                .title(req.getTitle())
                .comment(req.getComment())
                .updatedBy(userId)
                .build();

        Review saved = reviewRepo.save(review);
        log.info("Review submitted: type={} restaurantId={} userId={}",
                req.getReviewType(), req.getRestaurantId(), userId);

        // 7. Push rating to restaurant-service (non-blocking)
        pushRatings(saved);

        return ReviewResponse.from(saved);
    }

    // ── Queries ────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public Page<ReviewResponse> getRestaurantReviews(String restaurantId,
                                                      int page, int size) {
        // Verify restaurant exists
        validateRestaurantExists(restaurantId);

        return reviewRepo.findByRestaurantIdAndReviewTypeAndIsVisibleTrue(
                restaurantId, Review.ReviewType.RESTAURANT,
                PageRequest.of(page, size, Sort.by("createdAt").descending()))
                .map(ReviewResponse::from);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ReviewResponse> getMenuItemReviews(String menuItemId,
                                                    int page, int size) {
        return reviewRepo.findByMenuItemIdAndIsVisibleTrue(
                menuItemId,
                PageRequest.of(page, size, Sort.by("createdAt").descending()))
                .map(ReviewResponse::from);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ReviewResponse> getMyReviews(String userId, int page, int size) {
        return reviewRepo.findByUserIdOrderByCreatedAtDesc(
                userId, PageRequest.of(page, size))
                .map(ReviewResponse::from);
    }

    @Override
    @Transactional(readOnly = true)
    public ReviewResponse getById(String reviewId) {
        return reviewRepo.findById(reviewId)
                .map(ReviewResponse::from)
                .orElseThrow(() -> new ApiException("Review not found",
                        HttpStatus.NOT_FOUND, "REVIEW_NOT_FOUND"));
    }

    // ── Update own review ──────────────────────────────────

    @Override
    public ReviewResponse update(String reviewId, String userId,
                                  ReviewRequest req) {
        Review review = reviewRepo.findByIdAndUserId(reviewId, userId)
                .orElseThrow(() -> new ApiException(
                        "Review not found or not yours",
                        HttpStatus.NOT_FOUND, "REVIEW_NOT_FOUND"));

        int oldRating = review.getRating();
        review.setRating(req.getRating());
        review.setTitle(req.getTitle());
        review.setComment(req.getComment());
        review.setUpdatedBy(userId);

        Review saved = reviewRepo.save(review);
        if (oldRating != req.getRating()) pushRatings(saved);

        return ReviewResponse.from(saved);
    }

    // ── Delete own review ──────────────────────────────────

    @Override
    public void delete(String reviewId, String userId) {
        Review review = reviewRepo.findByIdAndUserId(reviewId, userId)
                .orElseThrow(() -> new ApiException(
                        "Review not found or not yours",
                        HttpStatus.NOT_FOUND, "REVIEW_NOT_FOUND"));
        reviewRepo.delete(review);
        log.info("Review deleted: {} by {}", reviewId, userId);
    }

    // ── Rating summaries ───────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public RatingSummary restaurantSummary(String restaurantId) {
        validateRestaurantExists(restaurantId);
        Double avg  = reviewRepo.avgRestaurantRating(restaurantId);
        long   total = reviewRepo.countByRestaurantIdAndReviewTypeAndIsVisibleTrue(
                restaurantId, Review.ReviewType.RESTAURANT);
        return buildSummary(restaurantId, "RESTAURANT", avg, total,
                reviewRepo.ratingBreakdownRestaurant(restaurantId));
    }

    @Override
    @Transactional(readOnly = true)
    public RatingSummary menuItemSummary(String menuItemId) {
        Double avg  = reviewRepo.avgMenuItemRating(menuItemId);
        long   total = reviewRepo.countByMenuItemIdAndIsVisibleTrue(menuItemId);
        return buildSummary(menuItemId, "MENU_ITEM", avg, total,
                reviewRepo.ratingBreakdownMenuItem(menuItemId));
    }

    // ── Admin hide ─────────────────────────────────────────

    @Override
    public ReviewResponse hide(String reviewId, String adminId) {
        Review review = reviewRepo.findById(reviewId)
                .orElseThrow(() -> new ApiException("Review not found",
                        HttpStatus.NOT_FOUND, "REVIEW_NOT_FOUND"));
        review.setIsVisible(false);
        review.setUpdatedBy(adminId);
        return ReviewResponse.from(reviewRepo.save(review));
    }

    // ── Private helpers ────────────────────────────────────

    private void validateUser(String userId) {
    // Primary check — auth-service (already working)
    try {
        Boolean inAuth = authClient.userExists(userId);
        if (Boolean.FALSE.equals(inAuth))
            throw new ApiException("User not found",
                    HttpStatus.NOT_FOUND, "USER_NOT_FOUND");
    } catch (ApiException e) {
        throw e;
    } catch (Exception e) {
        log.warn("Auth-service check skipped: {}", e.getMessage());
    }

    // Secondary check — user-service (non-blocking if 401)
    try {
        Boolean inUser = userClient.userExists(userId);
        if (Boolean.FALSE.equals(inUser))
            throw new ApiException("User profile not found",
                    HttpStatus.NOT_FOUND, "USER_PROFILE_NOT_FOUND");
    } catch (ApiException e) {
        // Only throw for actual NOT_FOUND — skip auth errors
        if ("USER_PROFILE_NOT_FOUND".equals(e.getErrorCode())) throw e;
        log.warn("User-service check skipped ({}): {}",
                e.getErrorCode(), e.getMessage());
    } catch (Exception e) {
        log.warn("User-service check skipped: {}", e.getMessage());
    }
    }
    private String fetchUserName(String userId) {
        try {
            Map<String, Object> response = userClient.getInternalProfile(userId);
            if (response != null && response.get("data") instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<String, Object> data = (Map<String, Object>) response.get("data");
                // UserProfile entity has field "name"
                Object name = data.get("name");
                if (name != null && !name.toString().isBlank())
                    return name.toString();
            }
        } catch (Exception e) {
            log.warn("Could not fetch user name for {}: {}", userId, e.getMessage());
        }
        return "User";
    }

    private Map<String, Object> validateRestaurantExists(String restaurantId) {
        try {
            Map<String, Object> data =
                    restaurantClient.getRestaurant(restaurantId);
            if (data == null)
                throw new ApiException("Restaurant not found: " + restaurantId,
                        HttpStatus.NOT_FOUND, "RESTAURANT_NOT_FOUND");

            // Check restaurant is active
            Object dataObj = data.get("data");
            if (dataObj instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<String, Object> r = (Map<String, Object>) dataObj;
                Boolean isActive = r.get("isActive") instanceof Boolean
                        ? (Boolean) r.get("isActive") : true;
                if (Boolean.FALSE.equals(isActive))
                    throw new ApiException(
                            "Restaurant is not active: " + restaurantId,
                            HttpStatus.BAD_REQUEST, "RESTAURANT_INACTIVE");
            }
            return data;
        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            throw new ApiException("Restaurant not found: " + restaurantId,
                    HttpStatus.NOT_FOUND, "RESTAURANT_NOT_FOUND");
        }
    }

    private Map<String, Object> validateMenuItemExists(String restaurantId,
                                                         String menuItemId) {
        try {
            Map<String, Object> data =
                    restaurantClient.getMenuItem(restaurantId, menuItemId);
            if (data == null)
                throw new ApiException("Menu item not found: " + menuItemId,
                        HttpStatus.NOT_FOUND, "MENU_ITEM_NOT_FOUND");

            // Verify item belongs to restaurant and is available
            Object dataObj = data.get("data");
            if (dataObj instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<String, Object> item = (Map<String, Object>) dataObj;

                // Verify correct restaurant
                String itemRestaurant = item.get("restaurantId") != null
                        ? item.get("restaurantId").toString() : "";
                if (!restaurantId.equals(itemRestaurant))
                    throw new ApiException(
                            "Menu item does not belong to this restaurant",
                            HttpStatus.BAD_REQUEST, "ITEM_RESTAURANT_MISMATCH");

                // Item must be available (means it was once served)
                // We allow reviews even for unavailable items
                // (item could be unavailable now but was available when ordered)
            }
            return data;
        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            throw new ApiException("Menu item not found: " + menuItemId,
                    HttpStatus.NOT_FOUND, "MENU_ITEM_NOT_FOUND");
        }
    }

    private void pushRatings(Review review) {
        if (review.getReviewType() == Review.ReviewType.RESTAURANT) {
            try {
                restaurantClient.updateRestaurantRating(
                        review.getRestaurantId(), review.getRating());
            } catch (Exception e) {
                log.warn("Restaurant rating push failed: {}", e.getMessage());
            }
        } else if (review.getReviewType() == Review.ReviewType.MENU_ITEM
                && review.getMenuItemId() != null) {
            try {
                restaurantClient.updateMenuItemRating(
                        review.getMenuItemId(), review.getRating());
            } catch (Exception e) {
                log.warn("Menu item rating push failed: {}", e.getMessage());
            }
        }
    }

    private RatingSummary buildSummary(String targetId, String targetType,
                                        Double avg, long total,
                                        List<Object[]> breakdown) {
        int[] stars = new int[6];
        for (Object[] row : breakdown) {
            int star  = ((Number) row[0]).intValue();
            long count = ((Number) row[1]).longValue();
            if (star >= 1 && star <= 5) stars[star] = (int) count;
        }
        return RatingSummary.builder()
                .targetId(targetId)
                .targetType(targetType)
                .averageRating(avg != null
                        ? Math.round(avg * 10.0) / 10.0 : 0.0)
                .totalReviews((int) total)
                .fiveStars(stars[5]).fourStars(stars[4])
                .threeStars(stars[3]).twoStars(stars[2]).oneStar(stars[1])
                .build();
    }

    @SuppressWarnings("unchecked")
    private String extract(Map<String, Object> map, String... keys) {
        Object cur = map;
        for (String k : keys) {
            if (cur instanceof Map) cur = ((Map<String, Object>) cur).get(k);
            else return null;
        }
        return cur != null ? cur.toString() : null;
    }
}
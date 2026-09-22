package com.fooddelivery.supportservice.dto.review;

import com.fooddelivery.supportservice.entity.Review;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;
import java.time.LocalDateTime;

@Data @Builder
@NoArgsConstructor @AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ReviewResponse {

    private String  reviewId;
    private String  userId;
    private String  userName;
    private String  reviewType;
    private String  restaurantId;
    private String  restaurantName;
    private String  menuItemId;
    private String  menuItemName;
    private String  categoryId;
    private String  categoryName;
    private String  orderId;
    private Integer rating;
    private String  title;
    private String  comment;
    private Boolean isVisible;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static ReviewResponse from(Review r) {
        return ReviewResponse.builder()
                .reviewId(r.getId())
                .userId(r.getUserId())
                .userName(r.getUserName())
                .reviewType(r.getReviewType().name())
                .restaurantId(r.getRestaurantId())
                .restaurantName(r.getRestaurantName())
                .menuItemId(r.getMenuItemId())
                .menuItemName(r.getMenuItemName())
                .categoryId(r.getCategoryId())
                .categoryName(r.getCategoryName())
                .orderId(r.getOrderId())
                .rating(r.getRating())
                .title(r.getTitle())
                .comment(r.getComment())
                .isVisible(r.getIsVisible())
                .createdAt(r.getCreatedAt())
                .updatedAt(r.getUpdatedAt())
                .build();
    }
}
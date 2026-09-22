package com.fooddelivery.supportservice.dto.review;

import com.fooddelivery.supportservice.entity.Review;
import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class ReviewRequest {

    @NotNull(message = "Review type is required: RESTAURANT or MENU_ITEM")
    private Review.ReviewType reviewType;

    @NotBlank(message = "Order ID is required")
    private String orderId;

    @NotBlank(message = "Restaurant ID is required")
    private String restaurantId;

    // Required only when reviewType = MENU_ITEM
    private String menuItemId;

    @NotNull(message = "Rating is required")
    @Min(value = 1, message = "Minimum rating is 1")
    @Max(value = 5, message = "Maximum rating is 5")
    private Integer rating;

    @Size(max = 150)
    private String title;

    @Size(max = 1000)
    private String comment;
}
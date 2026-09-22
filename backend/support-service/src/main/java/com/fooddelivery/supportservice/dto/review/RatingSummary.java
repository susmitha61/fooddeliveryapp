package com.fooddelivery.supportservice.dto.review;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

@Data @Builder
@NoArgsConstructor @AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class RatingSummary {
    private String  targetId;
    private String  targetType;    // RESTAURANT | MENU_ITEM
    private Double  averageRating;
    private Integer totalReviews;
    private Integer fiveStars;
    private Integer fourStars;
    private Integer threeStars;
    private Integer twoStars;
    private Integer oneStar;
}
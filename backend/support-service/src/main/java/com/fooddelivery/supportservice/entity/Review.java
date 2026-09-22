package com.fooddelivery.supportservice.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "reviews", indexes = {
    @Index(name = "idx_review_user",       columnList = "user_id"),
    @Index(name = "idx_review_restaurant", columnList = "restaurant_id"),
    @Index(name = "idx_review_item",       columnList = "menu_item_id"),
    @Index(name = "idx_review_order",      columnList = "order_id")
}, uniqueConstraints = {
    // One review per user per order per type — prevent duplicate
    @UniqueConstraint(
        name = "uq_user_order_type",
        columnNames = {"user_id", "order_id", "review_type"}
    )
})
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Review {

    @Id
    @Column(name = "review_id", length = 36)
    @Builder.Default
    private String id = UUID.randomUUID().toString();

    // ── Reviewer ──────────────────────────────────────────
    @Column(name = "user_id", nullable = false, length = 36)
    private String userId;

    @Column(name = "user_name", length = 100)
    private String userName;

    // ── Review target ─────────────────────────────────────
    @Enumerated(EnumType.STRING)
    @Column(name = "review_type", nullable = false, length = 20)
    private ReviewType reviewType;     // RESTAURANT | MENU_ITEM

    @Column(name = "restaurant_id", nullable = false, length = 36)
    private String restaurantId;

    @Column(name = "restaurant_name", length = 150)
    private String restaurantName;

    // Only populated for MENU_ITEM reviews
    @Column(name = "menu_item_id", length = 36)
    private String menuItemId;

    @Column(name = "menu_item_name", length = 150)
    private String menuItemName;

    @Column(name = "category_id", length = 36)
    private String categoryId;

    @Column(name = "category_name", length = 100)
    private String categoryName;

    // Order this review belongs to
    @Column(name = "order_id", nullable = false, length = 36)
    private String orderId;

    // ── Content ───────────────────────────────────────────
    @Column(name = "rating", nullable = false)
    private Integer rating;            // 1–5

    @Column(name = "title", length = 150)
    private String title;

    @Column(name = "comment", length = 1000)
    private String comment;

    @Column(name = "is_visible", nullable = false)
    @Builder.Default
    private Boolean isVisible = true;

    @Column(name = "updated_by", length = 36)
    private String updatedBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum ReviewType { RESTAURANT, MENU_ITEM }
}
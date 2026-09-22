package com.fooddelivery.restaurantservice.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "menu_items", indexes = {
    @Index(name = "idx_mi_restaurant", columnList = "restaurant_id"),
    @Index(name = "idx_mi_category",   columnList = "category_id"),
    @Index(name = "idx_mi_available",  columnList = "isAvailable"),
    @Index(name = "idx_mi_veg",        columnList = "isVegetarian"),
    @Index(name = "idx_mi_special",    columnList = "isTodaysSpecial"),
    @Index(name = "idx_mi_bestseller", columnList = "orderCount")
})
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class MenuItem {

    @Id
    @Column(name = "item_id", nullable = false, unique = true, length = 36)
    @Builder.Default
    private String id = UUID.randomUUID().toString();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "restaurant_id", nullable = false)
    private Restaurant restaurant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private MenuCategory category;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(length = 500)
    private String description;

    @Column(nullable = false)
    private Double price;

    // ── Dietary filters (BRD UC3) ──────────────────────────
    @Column(nullable = false)
    @Builder.Default
    private Boolean isVegetarian = false;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isVegan = false;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isSpicy = false;

    // ── Meal type filter ───────────────────────────────────
    @Column(name = "meal_type", length = 30)
    private String mealType;       // BREAKFAST, LUNCH, DINNER, SNACKS, ALL_DAY

    // ── Availability ───────────────────────────────────────
    @Column(nullable = false)
    @Builder.Default
    private Boolean isAvailable = true;

    // ── Special flags ──────────────────────────────────────
    @Column(name = "is_todays_special", nullable = false)
    @Builder.Default
    private Boolean isTodaysSpecial = false;

    @Column(name = "is_best_seller", nullable = false)
    @Builder.Default
    private Boolean isBestSeller = false;

    // Incremented by order-service via Kafka on each order
    @Column(name = "order_count", nullable = false)
    @Builder.Default
    private Integer orderCount = 0;

    // ── Rating — updated by support-service via Kafka ──────
    @Column(name = "rating")
    @Builder.Default
    private Double rating = 0.0;

    @Column(name = "total_ratings")
    @Builder.Default
    private Integer totalRatings = 0;

    // ── Media & Info ───────────────────────────────────────
    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(name = "preparation_time_minutes")
    @Builder.Default
    private Integer preparationTimeMinutes = 15;

    @Column(length = 300)
    private String allergenInfo;

    @Column
    private Integer calories;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
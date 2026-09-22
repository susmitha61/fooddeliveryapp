package com.fooddelivery.restaurantservice.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

@Entity
@Table(name = "restaurants", indexes = {
    @Index(name = "idx_city",    columnList = "city"),
    @Index(name = "idx_area",    columnList = "area"),
    @Index(name = "idx_cuisine", columnList = "cuisineType"),
    @Index(name = "idx_owner",   columnList = "ownerId"),
    @Index(name = "idx_status",  columnList = "status"),
    @Index(name = "idx_open",    columnList = "isOpen")
})
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Restaurant {

    @Id
    @Column(name = "restaurant_id", nullable = false, unique = true, length = 36)
    @Builder.Default
    private String id = UUID.randomUUID().toString();

    // Links to auth-service — forwarded via X-User-Email header
    @Column(name = "owner_id", nullable = false, length = 150)
    private String ownerId;

    // Associated managers assigned by Restaurant Owner or Admin
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "restaurant_manager_ids",
                     joinColumns = @JoinColumn(name = "restaurant_id"))
    @Column(name = "manager_id", length = 150)
    @Builder.Default
    private Set<String> managerIds = new HashSet<>();

    @Column(nullable = false, length = 150)
    private String name;

    @Column(length = 500)
    private String description;

    // ── Cuisine & Category ─────────────────────────────────
    @Column(nullable = false, length = 80)
    private String cuisineType;   // Indian, Chinese, Italian, etc.

    @ElementCollection(fetch = FetchType.EAGER)  
    @CollectionTable(name = "restaurant_meal_types",
                     joinColumns = @JoinColumn(name = "restaurant_id"))
    @Column(name = "meal_type", length = 30)
    @Builder.Default
    private Set<String> mealTypes = new HashSet<>();
    // BREAKFAST, LUNCH, DINNER, SNACKS, ALL_DAY

    // ── Location ───────────────────────────────────────────
    @Column(nullable = false, length = 300)
    private String streetAddress;

    @Column(nullable = false, length = 100)
    private String area;          // locality / neighbourhood

    @Column(nullable = false, length = 100)
    private String city;

    @Column(nullable = false, length = 100)
    private String state;

    @Column(nullable = false, length = 10)
    private String pincode;

    // ── Contact ────────────────────────────────────────────
    @Column(nullable = false, length = 20)
    private String phone;

    @Column(length = 150)
    private String email;

    // ── Operations ─────────────────────────────────────────
    @Column(nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isOpen = false;

    @Column(name = "opening_time")
    private LocalTime openingTime;

    @Column(name = "closing_time")
    private LocalTime closingTime;

    // ── Delivery ───────────────────────────────────────────
    @Column(name = "avg_delivery_minutes")
    @Builder.Default
    private Integer avgDeliveryMinutes = 30;

    @Column(name = "delivery_fee")
    @Builder.Default
    private Double deliveryFee = 0.0;

    @Column(name = "minimum_order_amount")
    @Builder.Default
    private Double minimumOrderAmount = 0.0;

    // ── Rating — updated by support-service via Kafka ──────
    @Column(nullable = false)
    @Builder.Default
    private Double rating = 0.0;

    @Column(name = "total_ratings")
    @Builder.Default
    private Integer totalRatings = 0;

    // ── Flags ──────────────────────────────────────────────
    @Column(name = "is_pure_veg", nullable = false)
    @Builder.Default
    private Boolean isPureVeg = false;

    @Column(name = "has_todays_special", nullable = false)
    @Builder.Default
    private Boolean hasTodaysSpecial = false;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private RestaurantStatus status = RestaurantStatus.PENDING_APPROVAL;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "restaurant",
               cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<MenuCategory> categories = new ArrayList<>();

    // ── Enums ──────────────────────────────────────────────
    public enum RestaurantStatus {
        PENDING_APPROVAL, ACTIVE, SUSPENDED, CLOSED
    }

    // ── Helpers ────────────────────────────────────────────
    public boolean isCurrentlyOpen() {
        if (!isOpen || !isActive) return false;
        if (openingTime == null || closingTime == null) return true;
        LocalTime now = LocalTime.now();
        return !now.isBefore(openingTime) && !now.isAfter(closingTime);
    }
}
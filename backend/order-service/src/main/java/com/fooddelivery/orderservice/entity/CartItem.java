package com.fooddelivery.orderservice.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity
@Table(name = "cart_items")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class CartItem {

    @Id
    @Column(name = "cart_item_id", length = 36)
    @Builder.Default
    private String id = UUID.randomUUID().toString();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cart_id", nullable = false)
    private Cart cart;

    @Column(name = "item_id", nullable = false, length = 36)
    private String itemId;

    @Column(name = "item_name", nullable = false, length = 150)
    private String itemName;

    @Column(nullable = false)
    private Double price;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "is_vegetarian")
    private Boolean isVegetarian;

    @Column(name = "is_available")
    @Builder.Default
    private Boolean isAvailable = true;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(name = "unavailable_reason", length = 200)
    private String unavailableReason;
}
package com.fooddelivery.orderservice.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;
import java.util.*;

@Entity
@Table(name = "carts")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Cart {

    @Id
    @Column(name = "cart_id", length = 36)
    @Builder.Default
    private String id = UUID.randomUUID().toString();

    @Column(name = "user_id", nullable = false, unique = true, length = 36)
    private String userId;

    @Column(name = "restaurant_id", length = 36)
    private String restaurantId;

    @Column(name = "restaurant_name", length = 150)
    private String restaurantName;

    @Column(name = "delivery_fee")
    @Builder.Default
    private Double deliveryFee = 0.0;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "cart",
               cascade = CascadeType.ALL,
               orphanRemoval = true,
               fetch = FetchType.EAGER)
    @Builder.Default
    private List<CartItem> items = new ArrayList<>();

    public void clearItems() {
        this.items.clear();
        this.restaurantId = null;
        this.restaurantName = null;
        this.deliveryFee = 0.0;
    }

    public boolean isEmpty() {
        return items == null || items.isEmpty();
    }

    public Double getSubtotal() {
        if (items == null) return 0.0;
        return items.stream()
                .mapToDouble(i -> i.getPrice() * i.getQuantity())
                .sum();
    }

    public Double getTotal() {
        return getSubtotal() + (deliveryFee != null ? deliveryFee : 0.0);
    }

    public int getTotalItems() {
        if (items == null) return 0;
        return items.stream().mapToInt(CartItem::getQuantity).sum();
    }
}
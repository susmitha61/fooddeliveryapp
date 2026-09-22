package com.fooddelivery.restaurantservice.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.*;

@Entity
@Table(name = "menu_categories")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class MenuCategory {

    @Id
    @Column(name = "category_id", nullable = false, unique = true, length = 36)
    @Builder.Default
    private String id = UUID.randomUUID().toString();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "restaurant_id", nullable = false)
    private Restaurant restaurant;

    @Column(nullable = false, length = 100)
    private String name;             // Starters, Mains, Desserts, Drinks

    @Column(length = 300)
    private String description;

    @Column(nullable = false)
    @Builder.Default
    private Integer displayOrder = 0;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @OneToMany(mappedBy = "category",
               cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<MenuItem> items = new ArrayList<>();
}
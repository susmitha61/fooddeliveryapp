package com.fooddelivery.userservice.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "favourites",
       uniqueConstraints = @UniqueConstraint(
           columnNames = {"user_id", "restaurant_id"}))
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Favourite {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "favourite_id", nullable = false, unique = true, length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore   
    private UserProfile userProfile;

    @Column(name = "restaurant_id", nullable = false, length = 36)
    private String restaurantId;

    @Column(name = "restaurant_name", nullable = false)
    private String restaurantName;

    @Column(name = "restaurant_cuisine")
    private String restaurantCuisine;

    @CreationTimestamp
    @Column(name = "saved_at", updatable = false)
    private LocalDateTime savedAt;
}
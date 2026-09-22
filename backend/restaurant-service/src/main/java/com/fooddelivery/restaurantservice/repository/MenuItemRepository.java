package com.fooddelivery.restaurantservice.repository;

import com.fooddelivery.restaurantservice.entity.MenuItem;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MenuItemRepository
        extends JpaRepository<MenuItem, String> {

    // ── All available items for a restaurant ──────────────
    List<MenuItem> findByRestaurantIdAndIsAvailableTrue(String restaurantId);

    // ── All items including unavailable (owner view) ──────
    List<MenuItem> findByRestaurantId(String restaurantId);

    // ── By category ────────────────────────────────────────
    List<MenuItem> findByCategoryIdAndIsAvailableTrue(String categoryId);

    // ── Best sellers (by order count) ─────────────────────
    @Query("SELECT m FROM MenuItem m WHERE m.restaurant.id = :restaurantId " +
           "AND m.isAvailable = true " +
           "ORDER BY m.orderCount DESC")
    List<MenuItem> findBestSellers(@Param("restaurantId") String restaurantId,
                                    Pageable pageable);

    // ── Today's specials ───────────────────────────────────
    List<MenuItem> findByRestaurantIdAndIsTodaysSpecialTrueAndIsAvailableTrue(
            String restaurantId);

    // ── Most rated ─────────────────────────────────────────
    @Query("SELECT m FROM MenuItem m WHERE m.restaurant.id = :restaurantId " +
           "AND m.isAvailable = true AND m.totalRatings > 0 " +
           "ORDER BY m.rating DESC")
    List<MenuItem> findMostRated(@Param("restaurantId") String restaurantId,
                                  Pageable pageable);

    // ── Full filter query (UC3) ────────────────────────────
    @Query("""
        SELECT m FROM MenuItem m
        WHERE m.restaurant.id = :restaurantId
        AND m.isAvailable = true
        AND (:isVeg     IS NULL OR m.isVegetarian = :isVeg)
        AND (:isVegan   IS NULL OR m.isVegan      = :isVegan)
        AND (:isSpicy   IS NULL OR m.isSpicy      = :isSpicy)
        AND (:mealType  IS NULL OR m.mealType     = :mealType)
        AND (:categoryId IS NULL OR m.category.id = :categoryId)
        AND (:keyword   IS NULL
             OR LOWER(m.name)        LIKE LOWER(CONCAT('%',:keyword,'%'))
             OR LOWER(m.description) LIKE LOWER(CONCAT('%',:keyword,'%')))
        """)
    List<MenuItem> filterItems(
            @Param("restaurantId") String restaurantId,
            @Param("isVeg")        Boolean isVeg,
            @Param("isVegan")      Boolean isVegan,
            @Param("isSpicy")      Boolean isSpicy,
            @Param("mealType")     String mealType,
            @Param("categoryId")   String categoryId,
            @Param("keyword")      String keyword);

    // ── Increment order count (called by order-service) ───
    @Modifying
    @Query("UPDATE MenuItem m SET m.orderCount = m.orderCount + 1 " +
           "WHERE m.id = :itemId")
    void incrementOrderCount(@Param("itemId") String itemId);

    // ── Update rating (called by support-service) ─────────
    @Modifying
    @Query("UPDATE MenuItem m SET " +
           "m.rating = (m.rating * m.totalRatings + :newRating) / (m.totalRatings + 1), " +
           "m.totalRatings = m.totalRatings + 1 " +
           "WHERE m.id = :itemId")
    void updateRating(@Param("itemId") String itemId,
                       @Param("newRating") double newRating);

      
       // ── Global dish search across all restaurants ──────────
       @Query("""
       SELECT m FROM MenuItem m
       WHERE m.isAvailable = true
       AND (LOWER(m.name)        LIKE LOWER(CONCAT('%',:keyword,'%'))
       OR  LOWER(m.description) LIKE LOWER(CONCAT('%',:keyword,'%')))
       ORDER BY m.orderCount DESC
       """)
       List<MenuItem> searchByDishName(@Param("keyword") String keyword,
                                   Pageable pageable);

       // ── Dish search within a specific restaurant ───────────
       @Query("""
       SELECT m FROM MenuItem m
       WHERE m.restaurant.id = :restaurantId
       AND m.isAvailable = true
       AND (LOWER(m.name)        LIKE LOWER(CONCAT('%',:keyword,'%'))
       OR  LOWER(m.description) LIKE LOWER(CONCAT('%',:keyword,'%')))
       ORDER BY m.orderCount DESC
       """)
       List<MenuItem> searchByDishNameInRestaurant(
              @Param("restaurantId") String restaurantId,
              @Param("keyword") String keyword);                       
}
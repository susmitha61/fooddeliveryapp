package com.fooddelivery.restaurantservice.repository;

import com.fooddelivery.restaurantservice.entity.Restaurant;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface RestaurantRepository
        extends JpaRepository<Restaurant, String> {

    List<Restaurant> findByOwnerIdAndIsActiveTrue(String ownerId);

    @Query("SELECT DISTINCT r FROM Restaurant r WHERE r.isActive = true AND (:userId MEMBER OF r.managerIds OR r.ownerId = :userId)")
    List<Restaurant> findByOwnerIdOrManagerId(@Param("userId") String userId);

    @Query("SELECT DISTINCT r FROM Restaurant r WHERE r.isActive = true AND :managerId MEMBER OF r.managerIds")
    List<Restaurant> findByManagerId(@Param("managerId") String managerId);

    Page<Restaurant> findByIsActiveTrueAndStatus(
            Restaurant.RestaurantStatus status, Pageable pageable);

    Page<Restaurant> findByIsActiveTrueAndIsOpenTrueAndStatus(
            Restaurant.RestaurantStatus status, Pageable pageable);

    Page<Restaurant> findByCityIgnoreCaseAndIsActiveTrueAndStatus(
            String city, Restaurant.RestaurantStatus status, Pageable pageable);

    Page<Restaurant> findByAreaIgnoreCaseAndIsActiveTrueAndStatus(
            String area, Restaurant.RestaurantStatus status, Pageable pageable);

    // ── FIX: removed hardcoded status = 'ACTIVE' ──────────
    @Query("SELECT r FROM Restaurant r WHERE r.isActive = true " +
           "AND LOWER(r.city) = LOWER(:city) " +
           "AND LOWER(r.area) = LOWER(:area)")
    Page<Restaurant> findNearby(@Param("city") String city,
                                 @Param("area") String area,
                                 Pageable pageable);

    // ── FIX: removed hardcoded status = 'ACTIVE' ──────────
    @Query("""
        SELECT DISTINCT r FROM Restaurant r
        WHERE r.isActive = true
        AND (:city      IS NULL OR LOWER(r.city)        = LOWER(:city))
        AND (:area      IS NULL OR LOWER(r.area)        = LOWER(:area))
        AND (:pincode   IS NULL OR r.pincode            = :pincode)
        AND (:cuisine   IS NULL OR LOWER(r.cuisineType) = LOWER(:cuisine))
        AND (:isPureVeg IS NULL OR r.isPureVeg          = :isPureVeg)
        AND (:isOpen    IS NULL OR r.isOpen             = :isOpen)
        AND (:minRating IS NULL OR r.rating            >= :minRating)
        AND (:keyword   IS NULL
             OR LOWER(r.name)        LIKE LOWER(CONCAT('%',:keyword,'%'))
             OR LOWER(r.cuisineType) LIKE LOWER(CONCAT('%',:keyword,'%'))
             OR LOWER(r.area)        LIKE LOWER(CONCAT('%',:keyword,'%')))
        """)
    Page<Restaurant> findByFilters(
            @Param("city")      String city,
            @Param("area")      String area,
            @Param("pincode")   String pincode,
            @Param("cuisine")   String cuisine,
            @Param("isPureVeg") Boolean isPureVeg,
            @Param("isOpen")    Boolean isOpen,
            @Param("minRating") Double minRating,
            @Param("keyword")   String keyword,
            Pageable pageable);

    @Query("SELECT r FROM Restaurant r WHERE r.isActive = true " +
           "AND r.rating >= :minRating " +
           "ORDER BY r.rating DESC")
    List<Restaurant> findTopRated(@Param("minRating") Double minRating,
                                   Pageable pageable);
}
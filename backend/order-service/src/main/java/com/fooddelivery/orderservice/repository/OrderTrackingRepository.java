package com.fooddelivery.orderservice.repository;

import com.fooddelivery.orderservice.entity.OrderTracking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderTrackingRepository extends JpaRepository<OrderTracking, String> {

    Optional<OrderTracking> findByOrderId(String orderId);

    @Query("SELECT t FROM OrderTracking t WHERE t.userId = :userId " +
           "AND t.status NOT IN ('DELIVERED','CANCELLED') " +
           "ORDER BY t.createdAt DESC")
    List<OrderTracking> findActiveTrackingByUserId(@Param("userId") String userId);

    List<OrderTracking> findByRestaurantIdAndStatusIn(
            String restaurantId,
            List<OrderTracking.TrackingStatus> statuses);
}
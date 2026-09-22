package com.fooddelivery.orderservice.repository;

import com.fooddelivery.orderservice.entity.Order;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, String> {

    // User order history — paginated
    Page<Order> findByUserIdOrderByCreatedAtDesc(String userId, Pageable pageable);

    // Active order for user
    @Query("SELECT o FROM Order o WHERE o.userId = :userId " +
           "AND o.status NOT IN ('DELIVERED','CANCELLED','PAYMENT_FAILED') " +
           "ORDER BY o.createdAt DESC")
    List<Order> findActiveOrdersByUserId(@Param("userId") String userId);

    // Restaurant active orders
    @Query("SELECT o FROM Order o WHERE o.restaurantId = :restaurantId " +
           "AND o.status IN ('CONFIRMED','PREPARING','READY_FOR_PICKUP') " +
           "ORDER BY o.createdAt ASC")
    List<Order> findActiveOrdersByRestaurantId(
            @Param("restaurantId") String restaurantId);

    Page<Order> findByRestaurantIdOrderByCreatedAtDesc(
            String restaurantId, Pageable pageable);

    List<Order> findByUserIdAndStatus(String userId, Order.OrderStatus status);

    @Query("SELECT o FROM Order o WHERE o.restaurantId = :restaurantId " +
           "AND o.status IN :statuses ORDER BY o.createdAt DESC")
    List<Order> findActiveOrdersByRestaurant(
            @Param("restaurantId") String restaurantId,
            @Param("statuses") List<Order.OrderStatus> statuses);

}
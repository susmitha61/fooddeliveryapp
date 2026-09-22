package com.fooddelivery.orderservice.repository;

import com.fooddelivery.orderservice.entity.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, String> {
    Optional<CartItem> findByCartIdAndItemId(String cartId, String itemId);
}
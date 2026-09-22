package com.fooddelivery.orderservice.service;

import com.fooddelivery.orderservice.dto.cart.*;

public interface CartService {
    CartResponse addToCart(String userId, AddToCartRequest request);
    CartResponse getCart(String userId);
    CartResponse updateCartItem(String userId, String cartItemId,
                                 UpdateCartItemRequest request);
    void removeCartItem(String userId, String cartItemId);
    void clearCart(String userId);
    // Validates all items + restaurant open status before checkout
    CartResponse validateCart(String userId);
}
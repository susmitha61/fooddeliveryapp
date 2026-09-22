package com.fooddelivery.orderservice.service;

import com.fooddelivery.orderservice.dto.cart.AddToCartRequest;
import com.fooddelivery.orderservice.dto.cart.CartResponse;
import com.fooddelivery.orderservice.dto.order.*;
import com.fooddelivery.orderservice.dto.tracking.TrackingResponse;
import com.fooddelivery.orderservice.entity.Order;
import org.springframework.data.domain.Page;
import java.util.List;

public interface OrderService {

    // BRD UC4 — Place order from validated cart
    OrderResponse placeOrder(String userId, PlaceOrderRequest request);

    // Get single order
    OrderResponse getOrder(String orderId, String userId);

    // User order history
    Page<OrderResponse> getUserOrders(String userId, int page, int size);

    // User active orders
    List<OrderResponse> getActiveOrders(String userId);

    // Restaurant view
    Page<OrderResponse> getRestaurantOrders(String restaurantId,
                                             int page, int size);

    List<OrderResponse> getRestaurantActiveOrders(String restaurantId);

    // Cancel order
    OrderResponse cancelOrder(String orderId, String userId, String reason);

    // Internal — called by Kafka consumer after payment
    void confirmOrderAfterPayment(String orderId, String paymentId);

    // Internal — payment failed
    void markPaymentFailed(String orderId, String reason);

    // Internal — update status (restaurant/driver)
    OrderResponse updateOrderStatus(String orderId, Order.OrderStatus status);

    // Cart
    CartResponse getCart(String userId);
    CartResponse addToCart(String userId, AddToCartRequest request);
    CartResponse updateCartItem(String userId, String cartItemId, int quantity);
    void removeFromCart(String userId, String cartItemId);
    void clearCart(String userId);

    Page<OrderResponse> getMyOrders(String userId, int page, int size);

    // Status updates — updatedBy = who triggered it
    OrderResponse updateStatus(String orderId,
                                Order.OrderStatus newStatus,
                                String updatedBy);

    // Payment update
    OrderResponse markPaymentDone(String orderId, String updatedBy);

    // Tracking
    TrackingResponse getTracking(String orderId);

    Page<OrderResponse> getAllOrders(int page, int size);
    OrderResponse enrichWithTracking(Order order);
}    
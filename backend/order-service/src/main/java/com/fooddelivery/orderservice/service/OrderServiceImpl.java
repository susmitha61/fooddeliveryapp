package com.fooddelivery.orderservice.service;

import com.fooddelivery.orderservice.client.RestaurantClient;
import com.fooddelivery.orderservice.client.UserClient;
import com.fooddelivery.orderservice.dto.cart.AddToCartRequest;
import com.fooddelivery.orderservice.dto.cart.CartResponse;
import com.fooddelivery.orderservice.dto.kafka.OrderPlacedEvent;
import com.fooddelivery.orderservice.dto.order.*;
import com.fooddelivery.orderservice.dto.tracking.TrackingResponse;
import com.fooddelivery.orderservice.entity.*;
import com.fooddelivery.orderservice.exception.ApiException;
import com.fooddelivery.orderservice.kafka.OrderEventProducer;
import com.fooddelivery.orderservice.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepo;
    private final CartRepository cartRepo;
    private final OrderTrackingRepository trackingRepo;
    private final CartService cartService;
    private final TrackingService trackingService;
    private final OrderEventProducer eventProducer;
    private final RestaurantClient restaurantClient;
    private final UserClient userClient;

    @Override
    public void confirmOrderAfterPayment(String orderId, String paymentId) {
        orderRepo.findById(orderId).ifPresentOrElse(order -> {
            order.setPaymentId(paymentId);
            order.setPaymentStatus(Order.PaymentStatus.PAID);
            order.setStatus(Order.OrderStatus.CONFIRMED);
            order.setConfirmedAt(LocalDateTime.now());
            order.setUpdatedBy("payment-service");
            orderRepo.save(order);

            // Sync tracking
            trackingService.syncTrackingWithOrderStatus(
                    orderId, Order.OrderStatus.CONFIRMED);

            log.info("Order confirmed after payment. orderId: {} paymentId: {}",
                    orderId, paymentId);
        }, () -> log.warn("confirmOrderAfterPayment: order not found: {}", orderId));
    }

    @Override
    public void markPaymentFailed(String orderId, String reason) {
        orderRepo.findById(orderId).ifPresentOrElse(order -> {
            order.setStatus(Order.OrderStatus.PAYMENT_FAILED);
            order.setPaymentStatus(Order.PaymentStatus.FAILED);
            order.setCancellationReason("Payment failed: " + reason);
            order.setUpdatedBy("payment-service");
            orderRepo.save(order);

            trackingService.syncTrackingWithOrderStatus(
                    orderId, Order.OrderStatus.CANCELLED);

            log.info("Order payment failed. orderId: {} reason: {}", orderId, reason);
        }, () -> log.warn("markPaymentFailed: order not found: {}", orderId));
    }

    
    @Override
    @Transactional(readOnly = true)
    public Page<OrderResponse> getUserOrders(String userId,
                                              int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return orderRepo.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(OrderResponse::from);
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderResponse> getActiveOrders(String userId) {
        return orderRepo.findActiveOrdersByUserId(userId)
                .stream().map(OrderResponse::from)
                .collect(Collectors.toList());
    }
   @Override
    public OrderResponse updateOrderStatus(String orderId,
                                            Order.OrderStatus status) {
        Order order = orderRepo.findById(orderId)
                .orElseThrow(() -> new ApiException("Order not found",
                        HttpStatus.NOT_FOUND, "ORDER_NOT_FOUND"));
        order.setStatus(status);
        if (status == Order.OrderStatus.DELIVERED)
            order.setDeliveredAt(LocalDateTime.now());
        orderRepo.save(order);

        // Sync tracking status
        trackingService.syncTrackingWithOrderStatus(orderId, status);
        return OrderResponse.from(order);
    }

    private final KafkaTemplate<String, Object> kafkaTemplate;

    // ── CART ───────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public CartResponse getCart(String userId) {
        Cart cart = cartRepo.findByUserId(userId)
                .orElseGet(() -> Cart.builder().userId(userId).build());
        return CartResponse.from(cart);
    }

    @Override
    public CartResponse addToCart(String userId, AddToCartRequest request) {
        Cart cart = cartRepo.findByUserId(userId)
                .orElseGet(() -> {
                    Cart c = Cart.builder().userId(userId).build();
                    return cartRepo.save(c);
                });

        // If adding from different restaurant — clear existing cart
        if (cart.getRestaurantId() != null
                && !cart.getRestaurantId().equals(request.getRestaurantId())) {
            cart.clearItems();
            log.info("Cart cleared — different restaurant for user: {}", userId);
        }

        // Set restaurant info
        cart.setRestaurantId(request.getRestaurantId());
        cart.setRestaurantName(request.getRestaurantName());
        cart.setDeliveryFee(request.getDeliveryFee());

        // Find existing item or add new
        Optional<CartItem> existing = cart.getItems().stream()
                .filter(i -> i.getItemId().equals(request.getItemId()))
                .findFirst();

        if (existing.isPresent()) {
            existing.get().setQuantity(
                    existing.get().getQuantity() + request.getQuantity());
        } else {
            CartItem item = CartItem.builder()
                    .cart(cart)
                    .itemId(request.getItemId())
                    .itemName(request.getItemName())
                    .price(request.getPrice())
                    .quantity(request.getQuantity())
                    .isVegetarian(request.getIsVegetarian())
                    .isAvailable(true)
                    .imageUrl(request.getImageUrl())
                    .build();
            cart.getItems().add(item);
        }

        return CartResponse.from(cartRepo.save(cart));
    }

    @Override
    public CartResponse updateCartItem(String userId, String cartItemId,
                                        int quantity) {
        Cart cart = cartRepo.findByUserId(userId)
                .orElseThrow(() -> new ApiException("Cart not found",
                        HttpStatus.NOT_FOUND, "CART_NOT_FOUND"));

        CartItem item = cart.getItems().stream()
                .filter(i -> i.getId().equals(cartItemId))
                .findFirst()
                .orElseThrow(() -> new ApiException("Item not in cart",
                        HttpStatus.NOT_FOUND, "CART_ITEM_NOT_FOUND"));

        if (quantity <= 0) {
            cart.getItems().remove(item);
            if (cart.getItems().isEmpty()) cart.clearItems();
        } else {
            item.setQuantity(quantity);
        }

        return CartResponse.from(cartRepo.save(cart));
    }

    @Override
    public void removeFromCart(String userId, String cartItemId) {
        Cart cart = cartRepo.findByUserId(userId)
                .orElseThrow(() -> new ApiException("Cart not found",
                        HttpStatus.NOT_FOUND, "CART_NOT_FOUND"));
        cart.getItems().removeIf(i -> i.getId().equals(cartItemId));
        if (cart.getItems().isEmpty()) cart.clearItems();
        cartRepo.save(cart);
    }

    @Override
    public void clearCart(String userId) {
        cartRepo.findByUserId(userId).ifPresent(cart -> {
            cart.clearItems();
            cartRepo.save(cart);
        });
    }

    // ── PLACE ORDER ────────────────────────────────────────

    @Override
    public OrderResponse placeOrder(String userId, PlaceOrderRequest request) {

        // ── Step 1: Validate user (non-blocking — don't fail if service down)
// Validate user exists — hard fail
    try {
        Boolean exists = userClient.userExists(userId);
        if (Boolean.FALSE.equals(exists))
            throw new ApiException("User account not found. Cannot place order.",
                    HttpStatus.NOT_FOUND, "USER_NOT_FOUND");
    } catch (ApiException e) {
        if ("USER_NOT_FOUND".equals(e.getErrorCode())) throw e;
        log.warn("User-service check failed — continuing: {}", e.getMessage());
    }
        catch (Exception e) {
            log.warn("User validation skipped — unexpected error: {}",
                    e.getMessage());
        }

        // ── Step 2: Get cart
        Cart cart = cartRepo.findByUserId(userId)
                .orElseThrow(() -> new ApiException(
                        "Cart is empty. Add items before placing order.",
                        HttpStatus.BAD_REQUEST, "CART_EMPTY"));

        if (cart.isEmpty())
            throw new ApiException(
                    "Cart is empty. Add items before placing order.",
                    HttpStatus.BAD_REQUEST, "CART_EMPTY");

        // ── Step 3: Build order
        Order order = Order.builder()
                .userId(userId)
                .restaurantId(cart.getRestaurantId())
                .restaurantName(cart.getRestaurantName())
                .deliveryAddress(request.getDeliveryAddress())
                .deliveryArea(request.getDeliveryArea())
                .deliveryCity(request.getDeliveryCity())
                .deliveryPincode(request.getDeliveryPincode())
                .paymentMethod(request.getPaymentMethod())
                .specialInstructions(request.getSpecialInstructions())
                .status(Order.OrderStatus.PLACED)
                .updatedBy(userId)
                .build();

        // ── Step 4: Build order items
        List<OrderItem> orderItems = new ArrayList<>();
        double subtotal = 0.0;

        for (CartItem ci : cart.getItems()) {
            double itemTotal = ci.getPrice() * ci.getQuantity();
            subtotal += itemTotal;
            orderItems.add(OrderItem.builder()
                    .order(order)
                    .itemId(ci.getItemId())
                    .itemName(ci.getItemName())
                    .price(ci.getPrice())
                    .quantity(ci.getQuantity())
                    .itemTotal(itemTotal)
                    .isVegetarian(ci.getIsVegetarian())
                    .imageUrl(ci.getImageUrl())
                    .build());
        }

        double deliveryFee = cart.getDeliveryFee() != null
                ? cart.getDeliveryFee() : 0.0;

        order.setSubtotal(subtotal);
        order.setDeliveryFee(deliveryFee);
        order.setTotalAmount(subtotal + deliveryFee);
        order.setItems(orderItems);

        // ── Step 5: Save order
        Order saved = orderRepo.save(order);

        // ── Step 6: Create tracking record
        OrderTracking tracking = OrderTracking.builder()
                .orderId(saved.getId())
                .userId(userId)
                .restaurantId(saved.getRestaurantId())
                .status(OrderTracking.TrackingStatus.ORDER_PLACED)
                .placedAt(LocalDateTime.now())
                .estimatedDeliveryTime(LocalDateTime.now().plusMinutes(45))
                .statusMessage("Order placed! Waiting for restaurant confirmation.")
                .updatedBy(userId)
                .build();
        trackingRepo.save(tracking);

        // ── Step 7: Clear cart immediately
        cart.clearItems();
        cartRepo.save(cart);
        log.info("Cart cleared after order placed. userId: {}", userId);

        // ── Step 8: Increment order count in restaurant-service (non-blocking)
        saved.getItems().forEach(item -> {
            try {
                restaurantClient.incrementOrderCount(item.getItemId());
            } catch (Exception e) {
                log.warn("Could not increment order count for item: {}. Error: {}",
                        item.getItemId(), e.getMessage());
            }
        });

        // ── Step 9: Publish Kafka event
        try {
            OrderPlacedEvent event = OrderPlacedEvent.builder()
                    .orderId(saved.getId())
                    .userId(userId)
                    .restaurantId(saved.getRestaurantId())
                    .restaurantName(saved.getRestaurantName())
                    .totalAmount(saved.getTotalAmount())
                    .paymentMethod(saved.getPaymentMethod().name())
                    .itemIds(saved.getItems().stream()
                            .map(OrderItem::getItemId)
                            .collect(Collectors.toList()))
                    .build();
            eventProducer.publishOrderPlaced(event);
        } catch (Exception e) {
            log.warn("Kafka publish failed (non-blocking): {}", e.getMessage());
        }

        log.info("Order placed successfully. orderId: {} userId: {} total: {}",
                saved.getId(), userId, saved.getTotalAmount());

        return enrichWithTracking(saved);
    }

    @Override
    public OrderResponse enrichWithTracking(Order order) {
        OrderResponse res = OrderResponse.from(order);
        if (trackingRepo != null && order.getId() != null) {
            trackingRepo.findByOrderId(order.getId()).ifPresent(t -> {
                res.setDriverName(t.getDriverName());
                res.setDriverPhone(t.getDriverPhone());
                res.setDriverVehicleNumber(t.getDriverVehicleNumber());
            });
        }
        return res;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<OrderResponse> getAllOrders(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return orderRepo.findAll(pageable).map(this::enrichWithTracking);
    }

// ── ORDER QUERIES ──────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public OrderResponse getOrder(String orderId, String userId) {
        Order order = orderRepo.findById(orderId)
                .orElseThrow(() -> new ApiException("Order not found",
                        HttpStatus.NOT_FOUND, "ORDER_NOT_FOUND"));
        if (!order.getUserId().equals(userId))
            throw new ApiException("Access denied",
                    HttpStatus.FORBIDDEN, "ACCESS_DENIED");
        return enrichWithTracking(order);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<OrderResponse> getMyOrders(String userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return orderRepo.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(this::enrichWithTracking);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<OrderResponse> getRestaurantOrders(String restaurantId,
                                                    int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return orderRepo.findByRestaurantIdOrderByCreatedAtDesc(
                restaurantId, pageable)
                .map(this::enrichWithTracking);
    }

    // ── STATUS UPDATES ─────────────────────────────────────

    @Override
    public OrderResponse updateStatus(String orderId,
                                    Order.OrderStatus newStatus,
                                    String updatedBy) {
        Order order = orderRepo.findById(orderId)
                .orElseThrow(() -> new ApiException("Order not found",
                        HttpStatus.NOT_FOUND, "ORDER_NOT_FOUND"));

        order.setStatus(newStatus);
        order.setUpdatedBy(updatedBy);

        if (newStatus == Order.OrderStatus.DELIVERED) {
            order.setDeliveredAt(LocalDateTime.now());
            if (order.getPaymentMethod() == Order.PaymentMethod.CASH_ON_DELIVERY)
                order.setPaymentStatus(Order.PaymentStatus.PAID);
        }
        if (newStatus == Order.OrderStatus.CONFIRMED)
            order.setConfirmedAt(LocalDateTime.now());

        Order saved = orderRepo.save(order);

        // Sync tracking separately
        trackingService.syncTrackingWithOrderStatus(orderId, newStatus);

        try {
            kafkaTemplate.send("order-status-updated-topic", saved.getId(),
                    java.util.Map.of("orderId", saved.getId(),
                        "status", newStatus.name(),
                        "updatedBy", updatedBy));
        } catch (Exception e) {
            log.warn("Kafka publish failed: {}", e.getMessage());
        }

        log.info("Order {} → {} by {}", orderId, newStatus, updatedBy);
        return enrichWithTracking(saved);
    }
   
    @Override
    public OrderResponse cancelOrder(String orderId, String userId,
                                      String reason) {
        Order order = orderRepo.findById(orderId)
                .orElseThrow(() -> new ApiException("Order not found",
                        HttpStatus.NOT_FOUND, "ORDER_NOT_FOUND"));

        if (!order.getUserId().equals(userId))
            throw new ApiException("Access denied",
                    HttpStatus.FORBIDDEN, "ACCESS_DENIED");

        if (order.getStatus() == Order.OrderStatus.DELIVERED
                || order.getStatus() == Order.OrderStatus.OUT_FOR_DELIVERY)
            throw new ApiException("Cannot cancel — order already dispatched",
                    HttpStatus.BAD_REQUEST, "CANNOT_CANCEL");

        order.setCancellationReason(reason);
        order.setUpdatedBy(userId);
        return updateStatus(orderId, Order.OrderStatus.CANCELLED, userId);
    }

    @Override
    public OrderResponse markPaymentDone(String orderId, String updatedBy) {
        Order order = orderRepo.findById(orderId)
                .orElseThrow(() -> new ApiException("Order not found",
                        HttpStatus.NOT_FOUND, "ORDER_NOT_FOUND"));
        order.setPaymentStatus(Order.PaymentStatus.PAID);
        order.setUpdatedBy(updatedBy);

        try {
            kafkaTemplate.send("payment-processed-topic",
                    orderId,
                    Map.of("orderId", orderId,
                           "amount", order.getTotalAmount(),
                           "status", "PAID"));
        } catch (Exception e) {
            log.warn("Kafka publish failed: {}", e.getMessage());
        }

        return enrichWithTracking(orderRepo.save(order));
    }

    @Override
    @Transactional(readOnly = true)
    public TrackingResponse getTracking(String orderId) {
        OrderTracking tracking = trackingRepo.findByOrderId(orderId)
                .orElseThrow(() -> new ApiException("Tracking not found",
                        HttpStatus.NOT_FOUND, "TRACKING_NOT_FOUND"));
        return TrackingResponse.from(tracking);
    }

    @Override
    public List<OrderResponse> getRestaurantActiveOrders(String restaurantId) {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'getRestaurantActiveOrders'");
    }
}
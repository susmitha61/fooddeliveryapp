package com.fooddelivery.orderservice.service;

import com.fooddelivery.orderservice.client.RestaurantClient;
import com.fooddelivery.orderservice.dto.cart.*;
import com.fooddelivery.orderservice.entity.*;
import com.fooddelivery.orderservice.exception.ApiException;
import com.fooddelivery.orderservice.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class CartServiceImpl implements CartService {

    private final CartRepository cartRepo;
    private final CartItemRepository cartItemRepo;
    private final RestaurantClient restaurantClient;

    @Override
    public CartResponse addToCart(String userId, AddToCartRequest req) {

        // ── Step 1: Validate restaurant exists and is open ─
        Map<String, Object> restaurantData = fetchRestaurant(req.getRestaurantId());
        boolean isOpen = Boolean.TRUE.equals(
                getNestedBoolean(restaurantData, "data", "isOpen"));
        boolean isActive = Boolean.TRUE.equals(
                getNestedBoolean(restaurantData, "data", "isActive"));

        if (!isActive)
            throw new ApiException("This restaurant is not available",
                    HttpStatus.BAD_REQUEST, "RESTAURANT_UNAVAILABLE");
        if (!isOpen)
            throw new ApiException(
                    "Restaurant is currently closed. Cannot add to cart.",
                    HttpStatus.BAD_REQUEST, "RESTAURANT_CLOSED");

        // ── Step 2: Validate menu item ─────────────────────
        Map<String, Object> itemData = fetchMenuItem(
                req.getRestaurantId(), req.getItemId());
        boolean isAvailable = Boolean.TRUE.equals(
                getNestedBoolean(itemData, "data", "isAvailable"));

        if (!isAvailable)
            throw new ApiException(
                    "Item is currently not available",
                    HttpStatus.BAD_REQUEST, "ITEM_UNAVAILABLE");

        // ── Step 3: Get or create cart ─────────────────────
        Cart cart = cartRepo.findByUserId(userId).orElseGet(() ->
                Cart.builder().userId(userId).build());

        // ── Step 4: If cart has different restaurant — clear it
        if (cart.getRestaurantId() != null &&
                !cart.getRestaurantId().equals(req.getRestaurantId())) {
            cart.getItems().clear();
            log.info("Cart cleared for userId: {} — new restaurant selected",
                    userId);
        }

        // ── Step 5: Set restaurant info ────────────────────
        cart.setRestaurantId(req.getRestaurantId());
        cart.setRestaurantName(getString(restaurantData, "data", "name"));
        cart.setDeliveryFee(getDouble(restaurantData, "data", "deliveryFee"));
        cartRepo.save(cart);

        // ── Step 6: Add or update item ─────────────────────
        CartItem existing = cartItemRepo
                .findByCartIdAndItemId(cart.getId(), req.getItemId())
                .orElse(null);

        if (existing != null) {
            existing.setQuantity(existing.getQuantity() + req.getQuantity());
            cartItemRepo.save(existing);
        } else {
            CartItem newItem = CartItem.builder()
                    .cart(cart)
                    .itemId(req.getItemId())
                    .itemName(getString(itemData, "data", "name"))
                    .price(getDouble(itemData, "data", "price"))
                    .quantity(req.getQuantity())
                    .isVegetarian(getNestedBoolean(itemData, "data",
                            "isVegetarian"))
                    .imageUrl(getString(itemData, "data", "imageUrl"))
                    .isAvailable(true)
                    .build();
            cart.getItems().add(newItem);
        }

        Cart saved = cartRepo.save(cart);
        log.info("Item {} added to cart for userId: {}", req.getItemId(), userId);
        return CartResponse.from(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public CartResponse getCart(String userId) {
        Cart cart = cartRepo.findByUserId(userId)
                .orElse(Cart.builder().userId(userId).build());
        return CartResponse.from(cart);
    }

    @Override
    public CartResponse updateCartItem(String userId, String cartItemId,
                                        UpdateCartItemRequest req) {
        Cart cart = getCartOrThrow(userId);

        CartItem item = cart.getItems().stream()
                .filter(i -> i.getId().equals(cartItemId))
                .findFirst()
                .orElseThrow(() -> new ApiException("Cart item not found",
                        HttpStatus.NOT_FOUND, "CART_ITEM_NOT_FOUND"));

        if (req.getQuantity() == 0) {
            cart.getItems().remove(item);
            // Clear restaurant info if cart is empty
            if (cart.getItems().isEmpty()) {
                cart.setRestaurantId(null);
                cart.setRestaurantName(null);
            }
        } else {
            item.setQuantity(req.getQuantity());
        }

        return CartResponse.from(cartRepo.save(cart));
    }

    @Override
    public void removeCartItem(String userId, String cartItemId) {
        Cart cart = getCartOrThrow(userId);
        cart.getItems().removeIf(i -> i.getId().equals(cartItemId));
        if (cart.getItems().isEmpty()) {
            cart.setRestaurantId(null);
            cart.setRestaurantName(null);
        }
        cartRepo.save(cart);
    }

    @Override
    public void clearCart(String userId) {
        cartRepo.findByUserId(userId).ifPresent(cart -> {
            cart.getItems().clear();
            cart.setRestaurantId(null);
            cart.setRestaurantName(null);
            cartRepo.save(cart);
        });
    }

    @Override
    public CartResponse validateCart(String userId) {
        Cart cart = getCartOrThrow(userId);

        if (cart.isEmpty())
            throw new ApiException("Cart is empty",
                    HttpStatus.BAD_REQUEST, "CART_EMPTY");

        // ── Validate restaurant still open ─────────────────
        try {
            Map<String, Object> restaurantData =
                    fetchRestaurant(cart.getRestaurantId());
            boolean isOpen = Boolean.TRUE.equals(
                    getNestedBoolean(restaurantData, "data", "isOpen"));
            boolean isActive = Boolean.TRUE.equals(
                    getNestedBoolean(restaurantData, "data", "isActive"));

            if (!isActive || !isOpen) {
                throw new ApiException(
                        "Restaurant is currently closed. " +
                        "Please clear your cart and try another restaurant.",
                        HttpStatus.BAD_REQUEST, "RESTAURANT_CLOSED");
            }
        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            log.warn("Could not validate restaurant: {}", e.getMessage());
        }

        // ── Validate each item ─────────────────────────────
        boolean hasUnavailable = false;
        for (CartItem item : cart.getItems()) {
            try {
                Map<String, Object> itemData = fetchMenuItem(
                        cart.getRestaurantId(), item.getItemId());
                boolean available = Boolean.TRUE.equals(
                        getNestedBoolean(itemData, "data", "isAvailable"));
                item.setIsAvailable(available);
                if (!available) {
                    item.setUnavailableReason("Item is currently sold out");
                    hasUnavailable = true;
                } else {
                    item.setUnavailableReason(null);
                }
            } catch (Exception e) {
                item.setIsAvailable(false);
                item.setUnavailableReason("Item no longer available");
                hasUnavailable = true;
            }
        }

        cartRepo.save(cart);

        if (hasUnavailable)
            throw new ApiException(
                    "Some items in your cart are sold out. " +
                    "Please remove them before proceeding.",
                    HttpStatus.BAD_REQUEST, "CART_HAS_UNAVAILABLE_ITEMS");

        return CartResponse.from(cart);
    }

    // ── Helpers ────────────────────────────────────────────

    private Cart getCartOrThrow(String userId) {
        return cartRepo.findByUserId(userId)
                .orElseThrow(() -> new ApiException("Cart not found",
                        HttpStatus.NOT_FOUND, "CART_NOT_FOUND"));
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> fetchRestaurant(String restaurantId) {
        try {
            Map<String, Object> response =
                    restaurantClient.getRestaurant(restaurantId);
            return response;
        } catch (Exception e) {
            throw new ApiException(
                    "Restaurant not found or service unavailable",
                    HttpStatus.BAD_REQUEST, "RESTAURANT_NOT_FOUND");
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> fetchMenuItem(String restaurantId,
                                               String itemId) {
        try {
            return restaurantClient.getMenuItem(restaurantId, itemId);
        } catch (Exception e) {
            throw new ApiException("Menu item not found",
                    HttpStatus.BAD_REQUEST, "ITEM_NOT_FOUND");
        }
    }

    @SuppressWarnings("unchecked")
    private Boolean getNestedBoolean(Map<String, Object> map,
                                      String... keys) {
        Object current = map;
        for (String key : keys) {
            if (current instanceof Map)
                current = ((Map<String, Object>) current).get(key);
            else return null;
        }
        return current instanceof Boolean ? (Boolean) current : null;
    }

    @SuppressWarnings("unchecked")
    private String getString(Map<String, Object> map, String... keys) {
        Object current = map;
        for (String key : keys) {
            if (current instanceof Map)
                current = ((Map<String, Object>) current).get(key);
            else return null;
        }
        return current != null ? current.toString() : null;
    }

    @SuppressWarnings("unchecked")
    private Double getDouble(Map<String, Object> map, String... keys) {
        Object current = map;
        for (String key : keys) {
            if (current instanceof Map)
                current = ((Map<String, Object>) current).get(key);
            else return 0.0;
        }
        if (current instanceof Number)
            return ((Number) current).doubleValue();
        return 0.0;
    }
}
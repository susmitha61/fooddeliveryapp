package com.fooddelivery.orderservice.controller;

import com.fooddelivery.orderservice.dto.*;
import com.fooddelivery.orderservice.dto.cart.AddToCartRequest;
import com.fooddelivery.orderservice.dto.cart.CartResponse;
import com.fooddelivery.orderservice.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/cart")
@RequiredArgsConstructor
@Tag(name = "Cart", description = "Cart management")
public class CartController {

    private final OrderService orderService;

    @GetMapping
    @Operation(summary = "Get cart")
    public ResponseEntity<ApiResponse<CartResponse>> getCart(
            @RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.ok(
                ApiResponse.success(orderService.getCart(userId)));
    }

    @PostMapping("/add")
    @Operation(summary = "Add item to cart")
    public ResponseEntity<ApiResponse<CartResponse>> addToCart(
            @RequestHeader("X-User-Id") String userId,
            @Valid @RequestBody AddToCartRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Item added to cart",
                        orderService.addToCart(userId, request)));
    }

    @PatchMapping("/items/{cartItemId}")
    @Operation(summary = "Update item quantity")
    public ResponseEntity<ApiResponse<CartResponse>> updateItem(
            @RequestHeader("X-User-Id") String userId,
            @PathVariable String cartItemId,
            @RequestParam int quantity) {
        return ResponseEntity.ok(ApiResponse.success("Cart updated",
                orderService.updateCartItem(userId, cartItemId, quantity)));
    }

    @DeleteMapping("/items/{cartItemId}")
    @Operation(summary = "Remove item from cart")
    public ResponseEntity<ApiResponse<Void>> removeItem(
            @RequestHeader("X-User-Id") String userId,
            @PathVariable String cartItemId) {
        orderService.removeFromCart(userId, cartItemId);
        return ResponseEntity.ok(ApiResponse.success("Item removed", null));
    }

    @DeleteMapping
    @Operation(summary = "Clear entire cart")
    public ResponseEntity<ApiResponse<Void>> clearCart(
            @RequestHeader("X-User-Id") String userId) {
        orderService.clearCart(userId);
        return ResponseEntity.ok(ApiResponse.success("Cart cleared", null));
    }
}
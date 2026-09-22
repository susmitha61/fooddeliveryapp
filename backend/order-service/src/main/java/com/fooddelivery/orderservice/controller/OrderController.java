package com.fooddelivery.orderservice.controller;

import com.fooddelivery.orderservice.dto.*;
import com.fooddelivery.orderservice.dto.order.OrderResponse;
import com.fooddelivery.orderservice.dto.order.PlaceOrderRequest;
import com.fooddelivery.orderservice.dto.tracking.TrackingResponse;
import com.fooddelivery.orderservice.entity.Order;
import com.fooddelivery.orderservice.exception.ApiException;
import com.fooddelivery.orderservice.repository.OrderRepository;
import com.fooddelivery.orderservice.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
@Tag(name = "Orders", description = "BRD Use Cases 4 & 5")
public class OrderController {

    private final OrderService orderService;
    private final OrderRepository orderRepo;

    @PostMapping("/place")
    @Operation(summary = "Place order from cart (UC4)")
    public ResponseEntity<ApiResponse<OrderResponse>> placeOrder(
            @RequestHeader("X-User-Id") String userId,
            @Valid @RequestBody PlaceOrderRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Order placed successfully",
                        orderService.placeOrder(userId, request)));
    }

    @GetMapping("/{orderId}")
    @Operation(summary = "Get order details")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrder(
            @PathVariable String orderId,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader(value = "X-User-Role", required = false) String role) {
        Order order = orderRepo.findById(orderId)
                .orElseThrow(() -> new ApiException("Order not found",
                        HttpStatus.NOT_FOUND, "ORDER_NOT_FOUND"));    

        boolean privileged = role != null && (role.contains("ADMIN") || role.contains("OWNER") || role.contains("MANAGER") || role.contains("DRIVER"));
        if (!privileged && !order.getUserId().equals(userId))
            throw new ApiException("Access denied",
                    HttpStatus.FORBIDDEN, "ACCESS_DENIED");    

        return ResponseEntity.ok(ApiResponse.success(orderService.enrichWithTracking(order)));
    }

    @GetMapping("/all")
    @Operation(summary = "Get all orders (ADMIN/DRIVER/MANAGEMENT)")
    public ResponseEntity<ApiResponse<Page<OrderResponse>>> allOrders(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(ApiResponse.success(
                orderService.getAllOrders(page, size)));
    }

    @GetMapping("/my-orders")
    @Operation(summary = "Get order history (UC5)")
    public ResponseEntity<ApiResponse<Page<OrderResponse>>> myOrders(
            @RequestHeader("X-User-Id") String userId,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success(
                orderService.getMyOrders(userId, page, size)));
    }

    @GetMapping("/restaurant/{restaurantId}")
    @Operation(summary = "Get restaurant's orders (OWNER)")
    public ResponseEntity<ApiResponse<Page<OrderResponse>>> restaurantOrders(
            @PathVariable String restaurantId,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success(
                orderService.getRestaurantOrders(restaurantId, page, size)));
    }

    @PatchMapping("/{orderId}/status")
    @Operation(summary = "Update order status (OWNER/DRIVER/ADMIN)")
    public ResponseEntity<ApiResponse<OrderResponse>> updateStatus(
            @PathVariable String orderId,
            @RequestParam Order.OrderStatus status,
            @RequestHeader("X-User-Id") String updatedBy) {
        return ResponseEntity.ok(ApiResponse.success("Status updated",
                orderService.updateStatus(orderId, status, updatedBy)));
    }

    @PatchMapping("/{orderId}/cancel")
    @Operation(summary = "Cancel order")
    public ResponseEntity<ApiResponse<OrderResponse>> cancel(
            @PathVariable String orderId,
            @RequestHeader("X-User-Id") String userId,
            @RequestParam(required = false,
                          defaultValue = "Cancelled by user") String reason) {
        return ResponseEntity.ok(ApiResponse.success("Order cancelled",
                orderService.cancelOrder(orderId, userId, reason)));
    }

    @PatchMapping("/{orderId}/payment-done")
    @Operation(summary = "Mark payment as done")
    public ResponseEntity<ApiResponse<OrderResponse>> paymentDone(
            @PathVariable String orderId,
            @RequestHeader("X-User-Id") String updatedBy) {
        return ResponseEntity.ok(ApiResponse.success("Payment marked done",
                orderService.markPaymentDone(orderId, updatedBy)));
    }

    @GetMapping("/{orderId}/tracking")
    @Operation(summary = "Track order (UC5)")
    public ResponseEntity<ApiResponse<TrackingResponse>> tracking(
            @PathVariable String orderId) {
        return ResponseEntity.ok(
                ApiResponse.success(orderService.getTracking(orderId)));
    }
    // ── INTERNAL — service-to-service only ────────────────

@GetMapping("/internal/{orderId}")
@Operation(summary = "Internal — get order by ID (payment-service)")
public ResponseEntity<ApiResponse<OrderResponse>> getOrderInternal(
        @PathVariable String orderId) {
    // No userId check — internal call from payment-service
    Order order = orderRepo.findById(orderId)
            .orElseThrow(() -> new ApiException("Order not found",
                    HttpStatus.NOT_FOUND, "ORDER_NOT_FOUND"));
    return ResponseEntity.ok(ApiResponse.success(OrderResponse.from(order)));
}

@PatchMapping("/internal/{orderId}/payment-done")
@Operation(summary = "Internal — mark order confirmed after payment")
public ResponseEntity<Void> markPaymentDoneInternal(
        @PathVariable String orderId) {
    orderService.updateStatus(orderId,
            Order.OrderStatus.CONFIRMED, "payment-service");
    System.out.printf("Order {} marked CONFIRMED via payment-service", orderId);
    return ResponseEntity.ok().build();
}
}
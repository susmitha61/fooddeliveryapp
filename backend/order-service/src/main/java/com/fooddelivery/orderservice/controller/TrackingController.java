package com.fooddelivery.orderservice.controller;

import com.fooddelivery.orderservice.dto.*;
import com.fooddelivery.orderservice.dto.tracking.TrackingResponse;
import com.fooddelivery.orderservice.entity.OrderTracking;
import com.fooddelivery.orderservice.service.TrackingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/tracking")
@RequiredArgsConstructor
@Tag(name = "Order Tracking", description = "BRD Use Case 5 — Real-time order tracking")
public class TrackingController {

    private final TrackingService trackingService;

    @GetMapping("/{orderId}")
    @Operation(summary = "Get tracking status for an order (UC5)")
    public ResponseEntity<ApiResponse<TrackingResponse>> getTracking(
            @PathVariable String orderId) {
        return ResponseEntity.ok(
                ApiResponse.success(trackingService.getTracking(orderId)));
    }

    @GetMapping("/my-active")
    @Operation(summary = "Get all active tracking for user (UC5)")
    public ResponseEntity<ApiResponse<List<TrackingResponse>>> activeTracking(
            @RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.ok(ApiResponse.success("Active tracking",
                trackingService.getActiveTrackingForUser(userId)));
    }

    // ── INTERNAL — called by restaurant / driver ───────────

    @PatchMapping("/internal/{orderId}/status")
    @Operation(summary = "Update tracking status (restaurant/driver)")
    public ResponseEntity<ApiResponse<TrackingResponse>> updateStatus(
            @PathVariable String orderId,
            @RequestParam OrderTracking.TrackingStatus status,
            @RequestParam(defaultValue = "") String message) {
        return ResponseEntity.ok(ApiResponse.success("Tracking updated",
                trackingService.updateStatus(orderId, status, message)));
    }

    @PatchMapping("/internal/{orderId}/assign-driver")
    @Operation(summary = "Assign driver to order")
    public ResponseEntity<ApiResponse<TrackingResponse>> assignDriver(
            @PathVariable String orderId,
            @RequestParam String driverName,
            @RequestParam String driverPhone,
            @RequestParam String vehicleNumber) {
        return ResponseEntity.ok(ApiResponse.success("Driver assigned",
                trackingService.assignDriver(orderId, driverName,
                        driverPhone, vehicleNumber)));
    }
}
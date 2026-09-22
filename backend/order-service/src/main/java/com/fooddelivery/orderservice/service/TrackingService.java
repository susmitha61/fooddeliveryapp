package com.fooddelivery.orderservice.service;

import com.fooddelivery.orderservice.dto.tracking.TrackingResponse;
import com.fooddelivery.orderservice.entity.*;
import java.util.List;

public interface TrackingService {
    // Created automatically when order is confirmed
    void createTracking(Order order);

    TrackingResponse getTracking(String orderId);

    List<TrackingResponse> getActiveTrackingForUser(String userId);

    // Update status — called by restaurant/driver
    TrackingResponse updateStatus(String orderId,
                                   OrderTracking.TrackingStatus status,
                                   String message);

    // Assign driver
    TrackingResponse assignDriver(String orderId, String driverName,
                                   String driverPhone, String vehicleNumber);

    // Sync with order status changes
    void syncTrackingWithOrderStatus(String orderId, Order.OrderStatus status);
}
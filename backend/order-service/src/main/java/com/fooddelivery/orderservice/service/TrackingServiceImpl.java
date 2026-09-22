package com.fooddelivery.orderservice.service;

import com.fooddelivery.orderservice.dto.tracking.TrackingResponse;
import com.fooddelivery.orderservice.entity.*;
import com.fooddelivery.orderservice.exception.ApiException;
import com.fooddelivery.orderservice.kafka.OrderEventProducer;
import com.fooddelivery.orderservice.repository.OrderTrackingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class TrackingServiceImpl implements TrackingService {

    private final OrderTrackingRepository trackingRepo;
    private final OrderEventProducer eventProducer;

    @Override
    public void createTracking(Order order) {
        if (trackingRepo.findByOrderId(order.getId()).isPresent()) return;

        OrderTracking tracking = OrderTracking.builder()
                .orderId(order.getId())
                .userId(order.getUserId())
                .restaurantId(order.getRestaurantId())
                .status(OrderTracking.TrackingStatus.ORDER_PLACED)
                .placedAt(LocalDateTime.now())
                .estimatedDeliveryTime(LocalDateTime.now().plusMinutes(45))
                .statusMessage("Order placed successfully!")
                .build();

        trackingRepo.save(tracking);
        log.info("Tracking created for orderId: {}", order.getId());
        eventProducer.publishTrackingUpdate(order.getId(),
                "ORDER_PLACED", tracking.getStatusMessage());
    }

    @Override
    @Transactional(readOnly = true)
    public TrackingResponse getTracking(String orderId) {
        return trackingRepo.findByOrderId(orderId)
                .map(TrackingResponse::from)
                .orElseThrow(() -> new ApiException(
                        "Tracking not found for order: " + orderId,
                        HttpStatus.NOT_FOUND, "TRACKING_NOT_FOUND"));
    }

    @Override
    @Transactional(readOnly = true)
    public List<TrackingResponse> getActiveTrackingForUser(String userId) {
        return trackingRepo.findActiveTrackingByUserId(userId)
                .stream().map(TrackingResponse::from)
                .collect(Collectors.toList());
    }

    @Override
    public TrackingResponse updateStatus(String orderId,
                                          OrderTracking.TrackingStatus status,
                                          String message) {
        OrderTracking tracking = trackingRepo.findByOrderId(orderId)
                .orElseThrow(() -> new ApiException("Tracking not found",
                        HttpStatus.NOT_FOUND, "TRACKING_NOT_FOUND"));

        tracking.setStatus(status);
        tracking.setStatusMessage(message);

        LocalDateTime now = LocalDateTime.now();
        switch (status) {
            case ORDER_CONFIRMED  -> tracking.setConfirmedAt(now);
            case PREPARING        -> tracking.setPreparingAt(now);
            case READY_FOR_PICKUP -> tracking.setReadyAt(now);
            case OUT_FOR_DELIVERY -> tracking.setPickedUpAt(now);
            case DELIVERED -> {
                tracking.setDeliveredAt(now);
                tracking.setActualDeliveryTime(now);
            }
            case CANCELLED -> tracking.setCancelledAt(now);
            default -> {}
        }

        OrderTracking saved = trackingRepo.save(tracking);
        log.info("Tracking updated: {} → {}", orderId, status);
        eventProducer.publishTrackingUpdate(orderId, status.name(), message);
        return TrackingResponse.from(saved);
    }

    @Override
    public TrackingResponse assignDriver(String orderId, String driverName,
                                          String driverPhone, String vehicleNumber) {
        OrderTracking tracking = trackingRepo.findByOrderId(orderId)
                .orElseThrow(() -> new ApiException("Tracking not found",
                        HttpStatus.NOT_FOUND, "TRACKING_NOT_FOUND"));

        tracking.setDriverName(driverName);
        tracking.setDriverPhone(driverPhone);
        tracking.setDriverVehicleNumber(vehicleNumber);
        tracking.setStatus(OrderTracking.TrackingStatus.DRIVER_ASSIGNED);
        tracking.setStatusMessage("Driver " + driverName + " assigned to your order.");

        OrderTracking saved = trackingRepo.save(tracking);
        eventProducer.publishTrackingUpdate(orderId,
                "DRIVER_ASSIGNED", tracking.getStatusMessage());
        return TrackingResponse.from(saved);
    }

    @Override
    public void syncTrackingWithOrderStatus(String orderId,
                                            Order.OrderStatus orderStatus) {
        trackingRepo.findByOrderId(orderId).ifPresent(tracking -> {

            LocalDateTime now = LocalDateTime.now();

            switch (orderStatus) {
                case CONFIRMED -> {
                    tracking.setStatus(OrderTracking.TrackingStatus.ORDER_CONFIRMED);
                    tracking.setConfirmedAt(now);
                    tracking.setStatusMessage(
                            "Order confirmed! Restaurant is preparing your food.");
                }
                case PREPARING -> {
                    tracking.setStatus(OrderTracking.TrackingStatus.PREPARING);
                    tracking.setPreparingAt(now);
                    tracking.setStatusMessage(
                            "Your food is being prepared.");
                }
                case READY_FOR_PICKUP -> {
                    tracking.setStatus(OrderTracking.TrackingStatus.READY_FOR_PICKUP);
                    tracking.setReadyAt(now);
                    tracking.setStatusMessage(
                            "Order ready! Waiting for driver to pick up.");
                }
                case OUT_FOR_DELIVERY -> {
                    tracking.setStatus(OrderTracking.TrackingStatus.OUT_FOR_DELIVERY);
                    tracking.setPickedUpAt(now);
                    tracking.setStatusMessage(
                            "Your order is out for delivery!");
                }
                case DELIVERED -> {
                    tracking.setStatus(OrderTracking.TrackingStatus.DELIVERED);
                    tracking.setDeliveredAt(now);
                    tracking.setActualDeliveryTime(now);
                    tracking.setStatusMessage(
                            "Order delivered! Enjoy your meal.");
                }
                case CANCELLED -> {
                    tracking.setStatus(OrderTracking.TrackingStatus.CANCELLED);
                    tracking.setCancelledAt(now);
                    tracking.setStatusMessage("Order has been cancelled.");
                }
                default -> {} // PLACED — no change needed
            }

            trackingRepo.save(tracking);
            log.info("Tracking synced for orderId: {} → {}", orderId, orderStatus);
        });
    }
}
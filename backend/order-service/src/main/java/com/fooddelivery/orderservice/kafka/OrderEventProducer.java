package com.fooddelivery.orderservice.kafka;

import com.fooddelivery.orderservice.dto.kafka.OrderPlacedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class OrderEventProducer {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void publishOrderPlaced(OrderPlacedEvent event) {
        kafkaTemplate.send("order-placed-topic", event.getOrderId(), event);
        log.info("Published order-placed event for orderId: {}",
                event.getOrderId());
    }

    public void publishOrderConfirmed(String orderId, String restaurantId) {
        kafkaTemplate.send("order-confirmed-topic", orderId,
                java.util.Map.of("orderId", orderId,
                                  "restaurantId", restaurantId,
                                  "event", "ORDER_CONFIRMED"));
        log.info("Published order-confirmed event for orderId: {}", orderId);
    }

    public void publishOrderCancelled(String orderId, String reason) {
        kafkaTemplate.send("order-cancelled-topic", orderId,
                java.util.Map.of("orderId", orderId,
                                  "reason", reason,
                                  "event", "ORDER_CANCELLED"));
        log.info("Published order-cancelled event for orderId: {}", orderId);
    }

    public void publishTrackingUpdate(String orderId, String status,
                                       String message) {
        kafkaTemplate.send("tracking-update-topic", orderId,
                java.util.Map.of("orderId", orderId,
                                  "status", status,
                                  "message", message));
        log.info("Published tracking update for orderId: {} status: {}",
                orderId, status);
    }
}
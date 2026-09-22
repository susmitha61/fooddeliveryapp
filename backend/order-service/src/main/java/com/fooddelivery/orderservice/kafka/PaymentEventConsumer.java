package com.fooddelivery.orderservice.kafka;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fooddelivery.orderservice.service.OrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class PaymentEventConsumer {

    private final OrderService orderService;
    private final ObjectMapper objectMapper;

    @KafkaListener(
        topics = "payment-success-topic",
        groupId = "order-group"
    )
    public void handlePaymentSuccess(String message) {
        log.info("Payment SUCCESS event received: {}", message);
        try {
            Map<String, Object> event =
                    objectMapper.readValue(message, Map.class);

            String orderId   = (String) event.get("orderId");
            String paymentId = (String) event.get("paymentId");

            if (orderId == null) {
                log.warn("Payment success event missing orderId — skipping");
                return;
            }

            orderService.confirmOrderAfterPayment(orderId,
                    paymentId != null ? paymentId : "unknown");

            log.info("Order confirmed after payment. orderId: {}", orderId);

        } catch (Exception e) {
            log.error("Failed to process payment success event: {} — message: {}",
                    e.getMessage(), message);
        }
    }

    @KafkaListener(
        topics = "payment-failed-topic",
        groupId = "order-group"
    )
    public void handlePaymentFailed(String message) {
        log.info("Payment FAILED event received: {}", message);
        try {
            Map<String, Object> event =
                    objectMapper.readValue(message, Map.class);

            String orderId = (String) event.get("orderId");
            String reason  = (String) event.getOrDefault(
                    "failureReason", "Payment failed");

            if (orderId == null) {
                log.warn("Payment failed event missing orderId — skipping");
                return;
            }

            orderService.markPaymentFailed(orderId, reason);

            log.info("Order marked payment failed. orderId: {}", orderId);

        } catch (Exception e) {
            log.error("Failed to process payment failed event: {} — message: {}",
                    e.getMessage(), message);
        }
    }
}
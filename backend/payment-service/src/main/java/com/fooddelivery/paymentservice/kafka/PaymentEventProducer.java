package com.fooddelivery.paymentservice.kafka;

import com.fooddelivery.paymentservice.dto.kafka.PaymentResultEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class PaymentEventProducer {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void publishPaymentSuccess(PaymentResultEvent event) {
        kafkaTemplate.send("payment-success-topic",
                event.getOrderId(), event);
        log.info("Payment SUCCESS published for orderId: {}",
                event.getOrderId());
    }

    public void publishPaymentFailed(PaymentResultEvent event) {
        kafkaTemplate.send("payment-failed-topic",
                event.getOrderId(), event);
        log.info("Payment FAILED published for orderId: {}",
                event.getOrderId());
    }

    public void publishRefund(PaymentResultEvent event) {
        kafkaTemplate.send("payment-refund-topic",
                event.getOrderId(), event);
        log.info("Payment REFUND published for orderId: {}",
                event.getOrderId());
    }
}
package com.fooddelivery.paymentservice.client;

import com.fooddelivery.paymentservice.config.FeignConfig;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@FeignClient(name = "order-service", configuration = FeignConfig.class)
public interface OrderServiceClient {

    // Internal endpoint — no auth check, service-to-service only
    @GetMapping("/api/v1/orders/internal/{orderId}")
    Map<String, Object> getOrderInternal(@PathVariable("orderId") String orderId);

    // Notify order-service payment done — internal
    @PatchMapping("/api/v1/orders/internal/{orderId}/payment-done")
    void markPaymentDone(@PathVariable("orderId") String orderId);
}
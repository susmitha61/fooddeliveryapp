package com.fooddelivery.paymentservice.client;

import com.fooddelivery.paymentservice.config.FeignConfig;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

@FeignClient(name = "auth-service", configuration = FeignConfig.class)
public interface AuthServiceClient {

    // Validate user exists in auth-service
    @GetMapping("/api/v1/auth/users/internal/exists/{userId}")
    Boolean userExists(@PathVariable("userId") String userId);
}
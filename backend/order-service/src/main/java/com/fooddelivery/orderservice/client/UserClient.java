package com.fooddelivery.orderservice.client;

import com.fooddelivery.orderservice.config.FeignConfig;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

@FeignClient(name = "user-service", configuration = FeignConfig.class)
public interface UserClient {

    @GetMapping("/api/v1/users/internal/exists/{userId}")
    Boolean userExists(@PathVariable("userId") String userId);
}
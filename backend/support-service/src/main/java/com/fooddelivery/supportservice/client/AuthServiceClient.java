package com.fooddelivery.supportservice.client;

import com.fooddelivery.supportservice.config.FeignConfig;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

@FeignClient(name = "auth-service", configuration = FeignConfig.class)
public interface AuthServiceClient {

    @GetMapping("/api/v1/auth/users/internal/exists/{userId}")
    Boolean userExists(@PathVariable("userId") String userId);
}
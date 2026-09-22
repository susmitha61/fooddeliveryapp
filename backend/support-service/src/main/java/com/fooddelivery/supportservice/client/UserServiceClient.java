package com.fooddelivery.supportservice.client;

import com.fooddelivery.supportservice.config.FeignConfig;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@FeignClient(name = "user-service", configuration = FeignConfig.class)
public interface UserServiceClient {

    @GetMapping("/api/v1/users/internal/exists/{userId}")
    Boolean userExists(@PathVariable("userId") String userId);

    @GetMapping("/api/v1/users/internal/profile/{userId}")
    Map<String, Object> getInternalProfile(
            @PathVariable("userId") String userId);
}
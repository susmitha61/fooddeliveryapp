package com.fooddelivery.authservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import com.fooddelivery.authservice.dto.UserProfileRequest;

@FeignClient(name = "user-service", url = "http://localhost:8082")
public interface UserServiceClient {

    @PostMapping("/api/v1/users/internal/create")
    void createUser(@RequestBody UserProfileRequest request);
}
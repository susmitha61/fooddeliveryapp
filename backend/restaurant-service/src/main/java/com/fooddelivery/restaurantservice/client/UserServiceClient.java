package com.fooddelivery.restaurantservice.client;

import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

@Component
@RequiredArgsConstructor
@Slf4j
public class UserServiceClient {

    private final RestTemplate restTemplate;

    private static final String USER_PROFILE_URL =
            "http://localhost:8082/api/v1/users/";

    public boolean userExists(String userId) {
        try {
            ResponseEntity<Object> response = restTemplate.getForEntity(
                    USER_PROFILE_URL + userId, Object.class);
            return response.getStatusCode() == HttpStatus.OK;
        } catch (HttpClientErrorException.NotFound e) {
            return false;
        } catch (Exception e) {
            log.error("Failed to verify user {}: {}", userId, e.getMessage());
            throw new RuntimeException("User service unavailable");
        }
    }
}
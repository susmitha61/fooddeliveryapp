package com.fooddelivery.userservice.client;

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
public class RestaurantServiceClient {

    private final RestTemplate restTemplate;

    private static final String RESTAURANT_URL =
            "http://localhost:8083/api/v1/restaurants/";

    public boolean restaurantExists(String restaurantId) {
        try {
            ResponseEntity<Object> response = restTemplate.getForEntity(
                    RESTAURANT_URL + restaurantId, Object.class);
            return response.getStatusCode() == HttpStatus.OK;
        } catch (HttpClientErrorException.NotFound e) {
            return false;
        } catch (Exception e) {
            log.error("Failed to verify restaurant {}: {}", restaurantId, e.getMessage());
            // Fail open — let it through if restaurant-service is down
            // Change to `return false` if you want strict validation
            throw new RuntimeException("Restaurant service unavailable");
        }
    }
}
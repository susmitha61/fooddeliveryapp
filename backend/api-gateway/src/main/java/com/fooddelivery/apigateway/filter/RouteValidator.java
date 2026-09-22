package com.fooddelivery.apigateway.filter;

import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import java.util.List;
import java.util.function.Predicate;

@Component
public class RouteValidator {

    public static final List<String> OPEN_ENDPOINTS = List.of(
        "/api/v1/auth/register",
        "/api/v1/auth/login",
        "/api/v1/auth/logout",
        "/api/v1/auth/validate-token",
        "/api/v1/auth/users/internal",     // auth-service internal
        "/api/v1/users/internal",          // user-service internal ← KEY FIX
        "/api/v1/menus/internal",
        "/api/v1/restaurants/internal",
        "/api/v1/orders/internal",
        "/actuator",
        "/v3/api-docs",
        "/swagger-ui"
    );

    public Predicate<ServerHttpRequest> isSecured =
        request -> OPEN_ENDPOINTS.stream()
            .noneMatch(uri -> request.getURI().getPath().contains(uri));
}
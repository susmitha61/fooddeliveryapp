package com.fooddelivery.supportservice.config;

import com.fooddelivery.supportservice.exception.ApiException;
import feign.Logger;
import feign.codec.ErrorDecoder;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;

@Configuration
@Slf4j
public class FeignConfig {

    @Bean
    public Logger.Level feignLoggerLevel() {
        return Logger.Level.BASIC;
    }

    @Bean
    public ErrorDecoder errorDecoder() {
        return (methodKey, response) -> {
            log.warn("Feign [{}] status={}", methodKey, response.status());
            return switch (response.status()) {
                case 401 -> new ApiException(
                        "Upstream returned 401 — endpoint may require auth",
                        HttpStatus.UNAUTHORIZED, "UPSTREAM_AUTH_REQUIRED");
                case 404 -> new ApiException("Resource not found",
                        HttpStatus.NOT_FOUND, "NOT_FOUND");
                case 400 -> new ApiException("Bad request",
                        HttpStatus.BAD_REQUEST, "BAD_REQUEST");
                case 403 -> new ApiException("Access denied",
                        HttpStatus.FORBIDDEN, "ACCESS_DENIED");
                default  -> new ApiException(
                        "Upstream service unavailable [status=" + response.status() + "]",
                        HttpStatus.SERVICE_UNAVAILABLE, "UPSTREAM_UNAVAILABLE");
            };
        };
    }
}
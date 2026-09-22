package com.fooddelivery.orderservice.config;

import com.fooddelivery.orderservice.exception.ApiException;
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
            log.warn("Feign error [{} {}] status: {}",
                    response.request().httpMethod(),
                    response.request().url(),
                    response.status());

            // 404 — resource genuinely not found
            if (response.status() == 404)
                return new ApiException(
                        "Resource not found",
                        HttpStatus.NOT_FOUND, "NOT_FOUND");

            // 400 — bad request from upstream
            if (response.status() == 400)
                return new ApiException(
                        "Bad request to upstream service",
                        HttpStatus.BAD_REQUEST, "BAD_REQUEST");

            // 503/500 — upstream down, return null-safe error
            // We log it but let the caller decide whether to fail
            return new ApiException(
                    "Upstream service temporarily unavailable",
                    HttpStatus.SERVICE_UNAVAILABLE, "UPSTREAM_UNAVAILABLE");
        };
    }
}
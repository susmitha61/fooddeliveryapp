package com.fooddelivery.paymentservice.config;

import com.fooddelivery.paymentservice.exception.ApiException;
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
            log.warn("Feign [{}] status={} url={}",
                    methodKey, response.status(),
                    response.request().url());

            switch (response.status()) {
                case 404 -> {
                    return new ApiException("Resource not found",
                            HttpStatus.NOT_FOUND, "NOT_FOUND");
                }
                case 400 -> {
                    return new ApiException("Bad request",
                            HttpStatus.BAD_REQUEST, "BAD_REQUEST");
                }
                case 403 -> {
                    return new ApiException("Access denied",
                            HttpStatus.FORBIDDEN, "ACCESS_DENIED");
                }
                default -> {
                    return new ApiException(
                            "Upstream service error [" + methodKey
                            + "] status=" + response.status(),
                            HttpStatus.SERVICE_UNAVAILABLE,
                            "UPSTREAM_UNAVAILABLE");
                }
            }
        };
    }
}
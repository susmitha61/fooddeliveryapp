package com.fooddelivery.restaurantservice.config;

import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Configuration
public class AppConfig {
@Bean
public RestTemplate restTemplate() {
    return new RestTemplateBuilder()
        .interceptors((request, body, execution) -> {
            ServletRequestAttributes attrs =
                    (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();

            if (attrs != null) {
                String auth = attrs.getRequest().getHeader("Authorization");
                if (auth != null) {
                    request.getHeaders().add("Authorization", auth);
                }
            }
            return execution.execute(request, body);
        })
        .build();
}
}
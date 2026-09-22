package com.fooddelivery.authservice.config;

import com.fooddelivery.authservice.security.JwtAuthFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.*;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final AuthenticationProvider authenticationProvider;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(auth -> auth
                        // BRD Use Case 1 — Public auth endpoints
                        .requestMatchers(HttpMethod.POST,
                                "/api/v1/auth/register",
                                "/api/v1/auth/login").permitAll()
                        .requestMatchers(HttpMethod.POST,
                                "/api/v1/auth/logout").authenticated()

                        // Swagger / Actuator — open
                        .requestMatchers(
                                "/actuator/**",
                                "/v3/api-docs/**",
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                        "/api/v1/auth/users/internal/**").permitAll()

                        // RBAC — Admin only
                        .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")

                        // RBAC — Manager + Admin + Restaurant Owner
                        .requestMatchers("/api/v1/manager/**")
                                .hasAnyRole("ADMIN", "MANAGER", "RESTAURANT_OWNER")
                                
                        .requestMatchers(HttpMethod.GET,
                                "/api/v1/auth/validate-token").permitAll()
                        // Everything else needs auth
                        .anyRequest().authenticated()
                )
                .sessionManagement(s ->
                        s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authenticationProvider(authenticationProvider)
                .addFilterBefore(jwtAuthFilter,
                        UsernamePasswordAuthenticationFilter.class)
                .build();
    }
}
package com.fooddelivery.userservice.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fooddelivery.userservice.dto.ApiResponse;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.client.RestTemplate;
import java.io.IOException;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class TokenValidationFilter extends OncePerRequestFilter {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    private static final String AUTH_VALIDATE_URL =
            "http://localhost:8081/api/v1/auth/validate-token";

    // ── ALL paths that bypass token validation ─────────────
    private static final String[] PUBLIC_PATHS = {
            "/actuator",
            "/v3/api-docs",
            "/swagger-ui",
            "/api/v1/users/internal"   // ← covers ALL internal endpoints
    };

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();

        // Skip public/internal paths — no token needed
        for (String pub : PUBLIC_PATHS) {
            if (path.startsWith(pub)) {
                filterChain.doFilter(request, response);
                return;
            }
        }

        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            sendUnauthorized(response, "Authorization header missing");
            return;
        }

        String token = authHeader.substring(7);

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", authHeader);
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            ResponseEntity<TokenValidationResponse> result =
                    restTemplate.exchange(
                            AUTH_VALIDATE_URL,
                            HttpMethod.GET,
                            entity,
                            TokenValidationResponse.class);

            if (result.getStatusCode() == HttpStatus.OK
                    && result.getBody() != null
                    && Boolean.TRUE.equals(result.getBody().getValid())) {

                String role   = result.getBody().getRole();
                String userId = result.getBody().getUserId();

                UsernamePasswordAuthenticationToken auth =
                        new UsernamePasswordAuthenticationToken(
                                userId, null,
                                List.of(new SimpleGrantedAuthority(role)));
                SecurityContextHolder.getContext().setAuthentication(auth);

                request.setAttribute("userId", userId);
                request.setAttribute("role", role);
                filterChain.doFilter(request, response);

            } else {
                sendUnauthorized(response, "Token is invalid or session has ended");
            }

        } catch (Exception e) {
            log.error("Token validation failed: {}", e.getMessage());
            sendUnauthorized(response, "Token validation failed");
        }
    }

    private void sendUnauthorized(HttpServletResponse response,
                                   String message) throws IOException {
        response.setStatus(HttpStatus.UNAUTHORIZED.value());
        response.setContentType("application/json");
        ApiResponse<?> body = ApiResponse.error(401, "UNAUTHORIZED", message);
        response.getWriter().write(objectMapper.writeValueAsString(body));
    }

    @lombok.Data
    public static class TokenValidationResponse {
        private Boolean valid;
        private String userId;
        private String role;
    }
}
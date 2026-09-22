package com.fooddelivery.authservice.security;

import com.fooddelivery.authservice.repository.AuthUserRepository;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.*;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;
    private final AuthUserRepository authUserRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        final String jwt = authHeader.substring(7);

        try {
            // 1. Validate token structure first
            if (!jwtService.isTokenStructureValid(jwt)) {
                log.warn("Invalid token structure from IP: {}",
                        request.getRemoteAddr());
                filterChain.doFilter(request, response);
                return;
            }

            final String userEmail = jwtService.extractUsername(jwt);

            if (userEmail != null &&
                    SecurityContextHolder.getContext().getAuthentication() == null) {

                // 2. Check if token is expired → auto-logout in DB
                if (jwtService.isTokenExpired(jwt)) {
                    log.info("Token expired for: {} — auto logging out", userEmail);
                    authUserRepository.invalidateToken(jwt);
                    filterChain.doFilter(request, response);
                    return;
                }

                // 3. Check token exists in DB (not manually logged out)
                boolean isActiveSession = authUserRepository
                        .findByCurrentToken(jwt)
                        .map(u -> !u.isTokenExpired() && u.getIsLoggedIn())
                        .orElse(false);

                if (!isActiveSession) {
                    log.warn("Token not active in DB for: {} — session expired or logged out",
                            userEmail);
                    filterChain.doFilter(request, response);
                    return;
                }

                // 4. Load user and set authentication
                UserDetails userDetails =
                        userDetailsService.loadUserByUsername(userEmail);

                if (jwtService.isTokenValid(jwt, userDetails)) {
                    var authToken = new UsernamePasswordAuthenticationToken(
                            userDetails, null, userDetails.getAuthorities());
                    authToken.setDetails(
                            new WebAuthenticationDetailsSource()
                                    .buildDetails(request));
                    SecurityContextHolder.getContext()
                            .setAuthentication(authToken);
                    log.debug("Auth set for user: {}", userEmail);
                }
            }
        } catch (Exception e) {
            log.error("JWT filter error: {}", e.getMessage());
        }

        filterChain.doFilter(request, response);
    }
}
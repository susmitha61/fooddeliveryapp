package com.fooddelivery.authservice.service;

import com.fooddelivery.authservice.config.JwtConfig;
import com.fooddelivery.authservice.dto.*;
import com.fooddelivery.authservice.entity.AuthUser;
import com.fooddelivery.authservice.exception.ApiException;
import com.fooddelivery.authservice.repository.AuthUserRepository;
import com.fooddelivery.authservice.security.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.authentication.*;
import org.springframework.security.core.userdetails.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import java.util.UUID;
import com.fooddelivery.authservice.client.UserServiceClient;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AuthServiceImpl implements AuthService {

    private final AuthUserRepository authUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final JwtConfig jwtConfig;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;
    private final UserServiceClient userServiceClient;

    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final int LOCK_DURATION_MINUTES = 15;

    // ── BRD Use Case 1: Registration ──────────────────────

    @Override
    public AuthResponse register(RegisterRequest request) {
        if (authUserRepository.existsByEmail(request.getEmail()))
            throw new ApiException("Email already registered",
                    HttpStatus.CONFLICT, "EMAIL_EXISTS");

        if (authUserRepository.existsByPhone(request.getPhone()))
            throw new ApiException("Phone number already registered",
                    HttpStatus.CONFLICT, "PHONE_EXISTS");

        AuthUser.Role role = request.getRole() != null
                ? request.getRole() : AuthUser.Role.CUSTOMER;

        AuthUser user = AuthUser.builder()
                .name(request.getName())
                .email(request.getEmail().toLowerCase().trim())
                .phone(request.getPhone())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(role)
                .isActive(true)
                .isLoggedIn(false)
                .failedLoginAttempts(0)
                .build();

        authUserRepository.save(user);
        String userId = user.getId();
        log.info("New user registered: {} | role: {}", user.getEmail(), role);

        userServiceClient.createUser(
                UserProfileRequest.builder()
                        .id(user.getId())
                        .name(request.getName())
                        .email(request.getEmail())
                        .phone(request.getPhone())
                        .build()
        );
        log.info("Calling user-service for userId: {}", user.getId());

        return issueToken(user);
    }

    // ── BRD Use Case 1: Login ─────────────────────────────

    @Override
    public AuthResponse login(LoginRequest request) {
        AuthUser user = authUserRepository
                .findByEmail(request.getEmail().toLowerCase().trim())
                .orElseThrow(() -> new ApiException(
                        "Invalid email or password",
                        HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS"));

        // Check account lock
        if (user.isAccountLocked())
            throw new ApiException(
                    "Account locked until " + user.getAccountLockedUntil(),
                    HttpStatus.LOCKED, "ACCOUNT_LOCKED");

        // Check active status
        if (!user.getIsActive())
            throw new ApiException("Account has been deactivated",
                    HttpStatus.FORBIDDEN, "ACCOUNT_DISABLED");

        // Authenticate password
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmail().toLowerCase().trim(),
                            request.getPassword()));
        } catch (BadCredentialsException e) {
            handleFailedLogin(user);
            throw new ApiException("Invalid email or password",
                    HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS");
        }

        // Reset failed attempts on successful login
        user.setFailedLoginAttempts(0);
        user.setAccountLockedUntil(null);

        log.info("User logged in: {}", user.getEmail());
        return issueToken(user);
    }

    // ── BRD Use Case 7: Logout ────────────────────────────

    @Override
    public void logout(String authHeader) {
        String token = extractToken(authHeader);

        authUserRepository.findByCurrentToken(token)
                .ifPresentOrElse(user -> {
                    user.setCurrentToken(null);
                    user.setTokenExpiresAt(null);
                    user.setIsLoggedIn(false);
                    user.setLastLogoutAt(LocalDateTime.now());
                    authUserRepository.save(user);
                    log.info("User logged out: {}", user.getEmail());
                }, () -> log.warn("Logout called with unknown/expired token"));
    }

    // ── BRD Use Case 7: Get Profile ───────────────────────

    @Override
    @Transactional(readOnly = true)
    public UserSummaryResponse getProfile(String authHeader) {
        String token = extractToken(authHeader);
        String email = jwtService.extractUsername(token);
        return authUserRepository.findByEmail(email)
                .map(UserSummaryResponse::from)
                .orElseThrow(() -> new ApiException("User not found",
                        HttpStatus.NOT_FOUND, "USER_NOT_FOUND"));
    }

    // ── BRD Use Case 7: Change Password ───────────────────

    @Override
    public void changePassword(String authHeader,
                                String oldPassword, String newPassword) {
        String token = extractToken(authHeader);
        String email = jwtService.extractUsername(token);

        AuthUser user = authUserRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException("User not found",
                        HttpStatus.NOT_FOUND, "USER_NOT_FOUND"));

        if (!passwordEncoder.matches(oldPassword, user.getPassword()))
            throw new ApiException("Current password is incorrect",
                    HttpStatus.BAD_REQUEST, "WRONG_PASSWORD");

        user.setPassword(passwordEncoder.encode(newPassword));
        // Force re-login after password change
        user.setCurrentToken(null);
        user.setIsLoggedIn(false);
        authUserRepository.save(user);
        log.info("Password changed for: {}", email);
    }

    // ── Admin: Change Role ────────────────────────────────

    @Override
    public UserSummaryResponse changeRole(String userId, AuthUser.Role role) {
        AuthUser user = authUserRepository.findById(userId)
                .orElseThrow(() -> new ApiException("User not found",
                        HttpStatus.NOT_FOUND, "USER_NOT_FOUND"));
        user.setRole(role);
        // Force re-login so new role takes effect in JWT
        user.setCurrentToken(null);
        user.setIsLoggedIn(false);
        authUserRepository.save(user);
        log.info("Role changed to {} for user id: {}", role, userId);
        return UserSummaryResponse.from(user);
    }

    // ── Admin: Toggle Active ──────────────────────────────

    @Override
    public UserSummaryResponse toggleUserActive(String userId) {
        AuthUser user = authUserRepository.findById(userId)
                .orElseThrow(() -> new ApiException("User not found",
                        HttpStatus.NOT_FOUND, "USER_NOT_FOUND"));
        user.setIsActive(!user.getIsActive());
        if (!user.getIsActive()) {
            // Deactivated — force logout
            user.setCurrentToken(null);
            user.setIsLoggedIn(false);
        }
        authUserRepository.save(user);
        return UserSummaryResponse.from(user);
    }

    // ── Manager/Admin: List Users ─────────────────────────

    @Override
    @Transactional(readOnly = true)
    public List<UserSummaryResponse> getAllUsers() {
        return authUserRepository.findAll().stream()
                .map(UserSummaryResponse::from)
                .collect(Collectors.toList());
    }

    // ── Admin: Active Sessions ────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public List<UserSummaryResponse> getActiveSessions() {
        return authUserRepository.findAllLoggedInUsers().stream()
                .map(UserSummaryResponse::from)
                .collect(Collectors.toList());
    }

    // ── Scheduled: auto-expire tokens every 5 min ─────────

    @Scheduled(fixedDelay = 300_000)
    public void cleanExpiredTokens() {
        authUserRepository.expireAllOverdueTokens();
        log.debug("Expired token cleanup complete");
    }

    // ── Private helpers ───────────────────────────────────

    private AuthResponse issueToken(AuthUser user) {
        UserDetails userDetails =
                userDetailsService.loadUserByUsername(user.getEmail());

        String token = jwtService.generateToken(
                userDetails, "ROLE_" + user.getRole().name(), user.getId());

        long expirySeconds = jwtConfig.getExpiration() / 1000;

        user.setCurrentToken(token);
        user.setTokenExpiresAt(
                LocalDateTime.now().plusSeconds(expirySeconds));
        user.setIsLoggedIn(true);
        user.setLastLoginAt(LocalDateTime.now());
        authUserRepository.save(user);

        return new AuthResponse(token, expirySeconds,
                UserSummaryResponse.from(user));
    }

    private void handleFailedLogin(AuthUser user) {
        int attempts = user.getFailedLoginAttempts() + 1;
        user.setFailedLoginAttempts(attempts);

        if (attempts >= MAX_FAILED_ATTEMPTS) {
            user.setAccountLockedUntil(
                    LocalDateTime.now().plusMinutes(LOCK_DURATION_MINUTES));
            log.warn("Account locked for: {} after {} failed attempts",
                    user.getEmail(), attempts);
        }
        authUserRepository.save(user);
    }

    private String extractToken(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer "))
            throw new ApiException("Authorization header missing",
                    HttpStatus.UNAUTHORIZED, "MISSING_TOKEN");
        return authHeader.substring(7);
    }
}
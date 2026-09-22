package com.fooddelivery.authservice.controller;
import com.fooddelivery.authservice.dto.*;
import com.fooddelivery.authservice.entity.AuthUser;
import com.fooddelivery.authservice.service.AuthService;
import com.fooddelivery.authservice.repository.AuthUserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;


@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@Tag(name = "Authentication & Authorization",
     description = "BRD Use Cases 1 & 7 — Registration, Login, Logout, Profile")
public class AuthController {

    private final AuthService authService;
    private final AuthUserRepository authUserRepository;
    

    // ── PUBLIC: BRD Use Case 1 ────────────────────────────

    @PostMapping("/auth/register")
    @Operation(summary = "Register new user (UC1)")
    public ResponseEntity<ApiResponse<AuthResponse>> register(
            @Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(
                        "Registration successful. Welcome!",
                        authService.register(request)));
    }

    @PostMapping("/auth/login")
    @Operation(summary = "Login (UC1)")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(
                ApiResponse.success("Login successful",
                        authService.login(request)));
    }

    // ── AUTHENTICATED: BRD Use Case 7 ────────────────────

    @PostMapping("/auth/logout")
    @Operation(summary = "Logout — token immediately invalidated (UC7)",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<Void>> logout(
            @RequestHeader("Authorization") String authHeader) {
        authService.logout(authHeader);
        return ResponseEntity.ok(
                ApiResponse.success("Logged out successfully", null));
    }

    @GetMapping("/auth/profile")
    @Operation(summary = "Get own profile (UC7)",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<UserSummaryResponse>> getProfile(
            @RequestHeader("Authorization") String authHeader) {
        return ResponseEntity.ok(
                ApiResponse.success(authService.getProfile(authHeader)));
    }

    @PatchMapping("/auth/change-password")
    @Operation(summary = "Change own password (UC7)",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @RequestHeader("Authorization") String authHeader,
            @Valid @RequestBody ChangePasswordRequest request) {
        authService.changePassword(authHeader,
                request.getOldPassword(), request.getNewPassword());
        return ResponseEntity.ok(
                ApiResponse.success(
                        "Password changed. Please login again.", null));
    }

    // ── MANAGER + ADMIN + RESTAURANT_OWNER ───────────────
 
    @GetMapping("/manager/users")
    @Operation(summary = "List all users — MANAGER/ADMIN/RESTAURANT_OWNER",
               security = @SecurityRequirement(name = "bearerAuth"))
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN','RESTAURANT_OWNER')")
    public ResponseEntity<ApiResponse<List<UserSummaryResponse>>> listUsers() {
        return ResponseEntity.ok(
                ApiResponse.success("Users retrieved",
                        authService.getAllUsers()));
    }

    // ── ADMIN ONLY ────────────────────────────────────────

    @PatchMapping("/admin/users/{id}/role")
    @Operation(summary = "Change user role — ADMIN only",
               security = @SecurityRequirement(name = "bearerAuth"))
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserSummaryResponse>> changeRole(
            @PathVariable String id,
            @RequestParam AuthUser.Role role) {
        return ResponseEntity.ok(
                ApiResponse.success("Role updated to " + role,
                        authService.changeRole(id, role)));
    }

    @PatchMapping("/admin/users/{id}/toggle-active")
    @Operation(summary = "Activate/Deactivate user — ADMIN only",
               security = @SecurityRequirement(name = "bearerAuth"))
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserSummaryResponse>> toggleActive(
            @PathVariable String id) {
        return ResponseEntity.ok(
                ApiResponse.success("User status updated",
                        authService.toggleUserActive(id)));
    }

    @GetMapping("/admin/sessions")
    @Operation(summary = "View all active sessions — ADMIN only",
               security = @SecurityRequirement(name = "bearerAuth"))
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<UserSummaryResponse>>> activeSessions() {
        return ResponseEntity.ok(
                ApiResponse.success("Active sessions",
                        authService.getActiveSessions()));
    }

    // ── Inner DTO for change-password ─────────────────────

    @Data
    public static class ChangePasswordRequest {
        @NotBlank private String oldPassword;
        @NotBlank @Size(min = 8) private String newPassword;
    }
    @GetMapping("/auth/validate-token")
    @Operation(summary = "Validate token — called internally by other services")
    public ResponseEntity<TokenValidationResponse> validateToken(
            @RequestHeader("Authorization") String authHeader) {
        
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.ok(new TokenValidationResponse(false, null, null));
        }

        String token = authHeader.substring(7);
        
        return authUserRepository.findByCurrentToken(token)
                .filter(u -> u.getIsLoggedIn()
                        && u.getIsActive()
                        && !u.isTokenExpired()
                        && !u.isAccountLocked())
                .map(u -> ResponseEntity.ok(new TokenValidationResponse(
                        true, u.getId(), "ROLE_" + u.getRole().name())))
                .orElse(ResponseEntity.ok(
                        new TokenValidationResponse(false, null, null)));
    }
    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class TokenValidationResponse {
        private Boolean valid;
        private String userId;
        private String role;
    }
    // Internal endpoint — called by payment-service
// Internal endpoint — called by payment-service
@GetMapping("/auth/users/internal/exists/{userId}")
public ResponseEntity<Boolean> checkUserExists(@PathVariable String userId) {
    boolean exists = authUserRepository.existsById(userId);
    return ResponseEntity.ok(exists);
}
}
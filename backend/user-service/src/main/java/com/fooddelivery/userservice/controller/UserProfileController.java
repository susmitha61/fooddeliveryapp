package com.fooddelivery.userservice.controller;

import com.fooddelivery.userservice.dto.*;
import com.fooddelivery.userservice.entity.UserProfile;
import com.fooddelivery.userservice.service.UserProfileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Tag(name = "User Profile", description = "BRD UC7 — Manage Account")
public class UserProfileController {

    private final UserProfileService profileService;

    @GetMapping("/{userId}")
    @Operation(summary = "Get user profile (UC7)")
    public ResponseEntity<ApiResponse<UserProfile>> getProfile(
            @PathVariable String userId) {
        return ResponseEntity.ok(
                ApiResponse.success(profileService.getProfile(userId)));
    }

    @PutMapping("/{userId}")
    @Operation(summary = "Update profile (UC7)")
    public ResponseEntity<ApiResponse<UserProfile>> updateProfile(
            @PathVariable String userId,
            @Valid @RequestBody UserProfileRequest request) {
        return ResponseEntity.ok(
                ApiResponse.success("Profile updated",
                        profileService.updateProfile(userId, request)));
    }

    // Internal endpoint — called by auth-service via Feign
    @PostMapping("/internal/create")
    public ResponseEntity<ApiResponse<UserProfile>> createUser(
            @RequestBody UserProfileRequest request) {
        log.info("Internal create called for userId: {}", request.getId());
        UserProfile profile = profileService.getOrCreate(
                request.getId(),
                request.getName(),
                request.getEmail(),
                request.getPhone());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Profile created", profile));
    }

    // Add the missing field for logging
    private static final org.slf4j.Logger log =
            org.slf4j.LoggerFactory.getLogger(UserProfileController.class);

    // ── INTERNAL — service-to-service, no auth required ────────

        @GetMapping("/internal/exists/{userId}")
        @Operation(summary = "Internal — check if user profile exists")
        public ResponseEntity<Boolean> checkExists(
                @PathVariable String userId) {
        return ResponseEntity.ok(profileService.existsById(userId));
        }

        @GetMapping("/internal/profile/{userId}")
        @Operation(summary = "Internal — get user profile for other services")
        public ResponseEntity<ApiResponse<UserProfile>> getInternalProfile(
                @PathVariable String userId) {
        try {
                UserProfile profile = profileService.getProfile(userId);
                return ResponseEntity.ok(ApiResponse.success(profile));
        } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error(404, "PROFILE_NOT_FOUND",
                                "User profile not found"));
        }
        }
}
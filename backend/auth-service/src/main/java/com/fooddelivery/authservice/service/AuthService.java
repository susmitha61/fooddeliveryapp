package com.fooddelivery.authservice.service;

import com.fooddelivery.authservice.dto.*;
import com.fooddelivery.authservice.entity.AuthUser;
import java.util.List;

public interface AuthService {

    // BRD Use Case 1 — User Registration
    AuthResponse register(RegisterRequest request);

    // BRD Use Case 1 — Login
    AuthResponse login(LoginRequest request);

    // BRD Use Case 7 — Logout
    void logout(String authHeader);

    // BRD Use Case 7 — Get own profile
    UserSummaryResponse getProfile(String authHeader);

    // BRD Use Case 7 — Change own password
    void changePassword(String authHeader,
                        String oldPassword, String newPassword);

    // Admin — change any user's role
    UserSummaryResponse changeRole(String userId, AuthUser.Role role);

    // Admin — deactivate account
    UserSummaryResponse toggleUserActive(String userId);

    // Manager/Admin — list users
    List<UserSummaryResponse> getAllUsers();

    // Admin — view active sessions
    List<UserSummaryResponse> getActiveSessions();
}
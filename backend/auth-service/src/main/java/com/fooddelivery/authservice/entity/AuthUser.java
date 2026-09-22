package com.fooddelivery.authservice.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;


@Entity
@Table(name = "auth_users", indexes = {
    @Index(name = "idx_email", columnList = "email"),
    @Index(name = "idx_token", columnList = "currentToken")
})
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class AuthUser {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, unique = true, length = 150)
    private String email;

    @Column(nullable = false, length = 20)
    private String phone;

    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private Role role = Role.CUSTOMER;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    // ── Session tracking ───────────────────────────────────
    @Column(nullable = false)
    @Builder.Default
    private Boolean isLoggedIn = false;

    // Single active token stored here — null when logged out
    @Column(name = "current_token", length = 1000)
    private String currentToken;

    // Token expiry timestamp
    @Column(name = "token_expires_at")
    private LocalDateTime tokenExpiresAt;

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    @Column(name = "last_logout_at")
    private LocalDateTime lastLogoutAt;

    // Login attempt tracking (BRD security requirement)
    @Column(name = "failed_login_attempts")
    @Builder.Default
    private Integer failedLoginAttempts = 0;

    @Column(name = "account_locked_until")
    private LocalDateTime accountLockedUntil;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    

    // ── RBAC Roles (BRD Use Case 1 + RBAC requirement) ────
    public enum Role {
        GUEST,             // browse restaurants/menus only
        CUSTOMER,          // full order flow
        RESTAURANT_OWNER,  // manage own restaurant + menu
        DELIVERY_DRIVER,   // view + update order tracking
        MANAGER,           // view all orders + reports + support
        ADMIN              // full system access
    }

    // Helper methods
    public boolean isAccountLocked() {
        return accountLockedUntil != null &&
               accountLockedUntil.isAfter(LocalDateTime.now());
    }

    public boolean isTokenExpired() {
        return tokenExpiresAt != null &&
               tokenExpiresAt.isBefore(LocalDateTime.now());
    }
}
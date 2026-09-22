package com.fooddelivery.authservice.repository;

import com.fooddelivery.authservice.entity.AuthUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface AuthUserRepository extends JpaRepository<AuthUser, String> {

    Optional<AuthUser> findByEmail(String email);

    Optional<AuthUser> findByCurrentToken(String token);

    boolean existsByEmail(String email);

    boolean existsByPhone(String phone);

    // Invalidate token on logout
    @Modifying
    @Query("UPDATE AuthUser u SET u.currentToken = null, " +
           "u.tokenExpiresAt = null, u.isLoggedIn = false, " +
           "u.lastLogoutAt = CURRENT_TIMESTAMP " +
           "WHERE u.currentToken = :token")
    void invalidateToken(@Param("token") String token);

    // Scheduled cleanup — expire all overdue tokens
    @Modifying
    @Query("UPDATE AuthUser u SET u.currentToken = null, " +
           "u.tokenExpiresAt = null, u.isLoggedIn = false " +
           "WHERE u.tokenExpiresAt < CURRENT_TIMESTAMP " +
           "AND u.currentToken IS NOT NULL")
    void expireAllOverdueTokens();

    // Manager/Admin: get all users by role
    List<AuthUser> findAllByRole(AuthUser.Role role);

    // Admin: get all active sessions
    @Query("SELECT u FROM AuthUser u WHERE u.isLoggedIn = true")
    List<AuthUser> findAllLoggedInUsers();
}
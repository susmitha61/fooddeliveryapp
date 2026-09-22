package com.fooddelivery.authservice.dto;

import com.fooddelivery.authservice.entity.AuthUser;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;
import java.time.LocalDateTime;

@Data @Builder
@NoArgsConstructor @AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UserSummaryResponse {

    private String id;
    private String name;
    private String email;
    private String phone;
    private String role;
    private Boolean isActive;
    private Boolean isLoggedIn;
    private LocalDateTime lastLoginAt;
    private LocalDateTime createdAt;

    public static UserSummaryResponse from(AuthUser user) {
        return UserSummaryResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole().name())
                .isActive(user.getIsActive())
                .isLoggedIn(user.getIsLoggedIn())
                .lastLoginAt(user.getLastLoginAt())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
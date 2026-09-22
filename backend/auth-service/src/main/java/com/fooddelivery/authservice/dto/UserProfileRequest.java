package com.fooddelivery.authservice.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserProfileRequest {
    private String id;
    private String name;
    private String email;
    private String phone;
    private String profilePictureUrl;
    private String bio;
}
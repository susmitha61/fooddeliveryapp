package com.fooddelivery.userservice.service;

import com.fooddelivery.userservice.dto.UserProfileRequest;
import com.fooddelivery.userservice.entity.UserProfile;

public interface UserProfileService {
    UserProfile getOrCreate(String userId, String name,
                             String email, String phone);
    UserProfile getProfile(String userId);
    UserProfile updateProfile(String userId, UserProfileRequest request);
    boolean existsById(String userId);
}
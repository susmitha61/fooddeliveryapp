package com.fooddelivery.userservice.service;

import com.fooddelivery.userservice.dto.UserProfileRequest;
import com.fooddelivery.userservice.entity.UserProfile;
import com.fooddelivery.userservice.exception.ApiException;
import com.fooddelivery.userservice.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class UserProfileServiceImpl implements UserProfileService {

    private final UserProfileRepository profileRepository;

    @Override
    public UserProfile getOrCreate(String userId, String name,
                                    String email, String phone) {
        return profileRepository.findById(userId).orElseGet(() -> {
            log.info("Creating new profile for userId: {}", userId);
            // Must set ID explicitly — no @GeneratedValue
            UserProfile p = new UserProfile();
            p.setId(userId);       // use the UUID from auth-service
            p.setName(name);
            p.setEmail(email);
            p.setPhone(phone);
            p.setIsActive(true);
            return profileRepository.save(p);
        });
    }

    @Override
    @Transactional(readOnly = true)
    public UserProfile getProfile(String userId) {
        return profileRepository.findById(userId)
                .orElseThrow(() -> new ApiException(
                        "Profile not found for userId: " + userId,
                        HttpStatus.NOT_FOUND, "PROFILE_NOT_FOUND"));
    }

    @Override
    public UserProfile updateProfile(String userId,
                                      UserProfileRequest request) {
        UserProfile profile = getProfile(userId);
        profile.setName(request.getName());
        profile.setPhone(request.getPhone());
        if (request.getProfilePictureUrl() != null)
            profile.setProfilePictureUrl(request.getProfilePictureUrl());
        if (request.getBio() != null)
            profile.setBio(request.getBio());
        return profileRepository.save(profile);
    }
    @Override
    @Transactional(readOnly = true)
    public boolean existsById(String userId) {
        return profileRepository.existsById(userId);
    }
}
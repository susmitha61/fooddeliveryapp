package com.fooddelivery.userservice.service;

import com.fooddelivery.userservice.dto.AddressRequest;
import com.fooddelivery.userservice.entity.*;
import com.fooddelivery.userservice.exception.ApiException;
import com.fooddelivery.userservice.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AddressServiceImpl implements AddressService {

    private final AddressRepository addressRepository;
    private final UserProfileRepository profileRepository;

    @Override
    public Address addAddress(String userId, AddressRequest req) {
        UserProfile profile = profileRepository.findById(userId)
                .orElseThrow(() -> new ApiException(
                        "Profile not found for userId: " + userId,
                        HttpStatus.NOT_FOUND, "PROFILE_NOT_FOUND"));

        if (Boolean.TRUE.equals(req.getIsDefault()))
            addressRepository.clearDefaultForUser(userId);

        Address address = Address.builder()
                .userProfile(profile)
                .label(req.getLabel())
                .streetAddress(req.getStreetAddress())
                .city(req.getCity())
                .state(req.getState())
                .pincode(req.getPincode())
                .landmark(req.getLandmark())
                .latitude(req.getLatitude())
                .longitude(req.getLongitude())
                .isDefault(Boolean.TRUE.equals(req.getIsDefault()))
                .build();

        Address saved = addressRepository.save(address);
        log.info("Address added for userId: {}", userId);
        return saved;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Address> getAddresses(String userId) {
        return addressRepository.findAllByUserProfileId(userId);
    }

    @Override
    public Address updateAddress(String userId, String addressId,
                                  AddressRequest req) {
        Address address = addressRepository
                .findByIdAndUserProfileId(addressId, userId)
                .orElseThrow(() -> new ApiException("Address not found",
                        HttpStatus.NOT_FOUND, "ADDRESS_NOT_FOUND"));

        if (Boolean.TRUE.equals(req.getIsDefault()))
            addressRepository.clearDefaultForUser(userId);

        address.setLabel(req.getLabel());
        address.setStreetAddress(req.getStreetAddress());
        address.setCity(req.getCity());
        address.setState(req.getState());
        address.setPincode(req.getPincode());
        address.setLandmark(req.getLandmark());
        address.setLatitude(req.getLatitude());
        address.setLongitude(req.getLongitude());
        address.setIsDefault(Boolean.TRUE.equals(req.getIsDefault()));

        return addressRepository.save(address);
    }

    @Override
    public void deleteAddress(String userId, String addressId) {
        Address address = addressRepository
                .findByIdAndUserProfileId(addressId, userId)
                .orElseThrow(() -> new ApiException("Address not found",
                        HttpStatus.NOT_FOUND, "ADDRESS_NOT_FOUND"));
        addressRepository.delete(address);
    }

    @Override
    public Address setDefaultAddress(String userId, String addressId) {
        addressRepository.clearDefaultForUser(userId);
        Address address = addressRepository
                .findByIdAndUserProfileId(addressId, userId)
                .orElseThrow(() -> new ApiException("Address not found",
                        HttpStatus.NOT_FOUND, "ADDRESS_NOT_FOUND"));
        address.setIsDefault(true);
        return addressRepository.save(address);
    }
}
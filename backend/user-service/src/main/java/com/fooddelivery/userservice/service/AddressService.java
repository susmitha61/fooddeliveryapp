package com.fooddelivery.userservice.service;

import com.fooddelivery.userservice.dto.AddressRequest;
import com.fooddelivery.userservice.entity.Address;
import java.util.List;

public interface AddressService {
    Address addAddress(String userId, AddressRequest request);
    List<Address> getAddresses(String userId);
    Address updateAddress(String userId, String addressId, AddressRequest request);
    void deleteAddress(String userId, String addressId);
    Address setDefaultAddress(String userId, String addressId);
}
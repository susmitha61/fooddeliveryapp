package com.fooddelivery.userservice.controller;

import com.fooddelivery.userservice.dto.*;
import com.fooddelivery.userservice.entity.Address;
import com.fooddelivery.userservice.service.AddressService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/addresses")
@RequiredArgsConstructor
@Tag(name = "Address Management", description = "BRD UC9 — Delivery Addresses")
public class AddressController {

    private final AddressService addressService;

    @PostMapping("/users/{userId}")
    @Operation(summary = "Add delivery address (UC9)")
    public ResponseEntity<ApiResponse<Address>> addAddress(
            @PathVariable String userId,
            @Valid @RequestBody AddressRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Address added",
                        addressService.addAddress(userId, request)));
    }

    @GetMapping("/users/{userId}")
    @Operation(summary = "Get all addresses (UC9)")
    public ResponseEntity<ApiResponse<List<Address>>> getAddresses(
            @PathVariable String userId) {
        return ResponseEntity.ok(
                ApiResponse.success(addressService.getAddresses(userId)));
    }

    @PutMapping("/users/{userId}/{addressId}")
    @Operation(summary = "Update address (UC9)")
    public ResponseEntity<ApiResponse<Address>> updateAddress(
            @PathVariable String userId,
            @PathVariable String addressId,
            @Valid @RequestBody AddressRequest request) {
        return ResponseEntity.ok(
                ApiResponse.success("Address updated",
                        addressService.updateAddress(userId, addressId, request)));
    }

    @DeleteMapping("/users/{userId}/{addressId}")
    @Operation(summary = "Delete address")
    public ResponseEntity<ApiResponse<Void>> deleteAddress(
            @PathVariable String userId,
            @PathVariable String addressId) {
        addressService.deleteAddress(userId, addressId);
        return ResponseEntity.ok(ApiResponse.success("Address deleted", null));
    }

    @PatchMapping("/users/{userId}/{addressId}/set-default")
    @Operation(summary = "Set default address (UC9)")
    public ResponseEntity<ApiResponse<Address>> setDefault(
            @PathVariable String userId,
            @PathVariable String addressId) {
        return ResponseEntity.ok(
                ApiResponse.success("Default updated",
                        addressService.setDefaultAddress(userId, addressId)));
    }
}
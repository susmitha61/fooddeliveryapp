package com.fooddelivery.userservice.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class AddressRequest {

    @NotBlank(message = "Label is required")
    private String label;        // HOME / WORK / OTHER

    @NotBlank(message = "Street address is required")
    private String streetAddress;

    @NotBlank(message = "City is required")
    private String city;

    @NotBlank(message = "State is required")
    private String state;

    @NotBlank(message = "Pincode is required")
    @Pattern(regexp = "^[1-9][0-9]{5}$",
             message = "Invalid Indian pincode")
    private String pincode;

    private String landmark;
    private Double latitude;
    private Double longitude;
    private Boolean isDefault;
}
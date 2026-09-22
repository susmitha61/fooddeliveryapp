package com.fooddelivery.authservice.dto;

import com.fooddelivery.authservice.entity.AuthUser;
import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class RegisterRequest {

    @NotBlank(message = "Name is required")
    @Size(min = 2, max = 100, message = "Name must be 2-100 characters")
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Phone is required")
    @Pattern(regexp = "^[6-9]\\d{9}$",
             message = "Invalid Indian mobile number")
    private String phone;

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters")
    @Pattern(regexp = "^(?=.*[0-9])(?=.*[a-zA-Z]).{8,}$",
             message = "Password must contain letters and numbers")
    private String password;

    // Optional — defaults to CUSTOMER (BRD UC1)
    private AuthUser.Role role;
}
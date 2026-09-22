package com.fooddelivery.authservice.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

@Getter 
@Setter
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AuthResponse {

    private String accessToken;
    private String tokenType;
    private Long expiresIn;       // seconds
    private UserSummaryResponse user;

    public AuthResponse(String accessToken, Long expiresIn,
                        UserSummaryResponse user) {
        this.accessToken = accessToken;
        this.tokenType   = "Bearer";
        this.expiresIn   = expiresIn;
        this.user        = user;
    }
}
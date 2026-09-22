package com.fooddelivery.paymentservice.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;
import java.time.Instant;

@Data @Builder
@NoArgsConstructor @AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {
    private int status;
    private String message;
    private T data;
    private String errorCode;
    private String timestamp;

    public static <T> ApiResponse<T> success(T data) {
        return ApiResponse.<T>builder().status(200).message("Success")
                .data(data).timestamp(Instant.now().toString()).build();
    }
    public static <T> ApiResponse<T> success(String msg, T data) {
        return ApiResponse.<T>builder().status(200).message(msg)
                .data(data).timestamp(Instant.now().toString()).build();
    }
    public static <T> ApiResponse<T> created(String msg, T data) {
        return ApiResponse.<T>builder().status(201).message(msg)
                .data(data).timestamp(Instant.now().toString()).build();
    }
    public static <T> ApiResponse<T> error(int s, String code, String msg) {
        return ApiResponse.<T>builder().status(s).errorCode(code)
                .message(msg).timestamp(Instant.now().toString()).build();
    }
}
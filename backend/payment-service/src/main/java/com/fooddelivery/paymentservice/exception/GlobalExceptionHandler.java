package com.fooddelivery.paymentservice.exception;

import com.fooddelivery.paymentservice.dto.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ApiResponse<?>> handleApi(ApiException ex) {
        log.error("[{}] {}", ex.getErrorCode(), ex.getMessage());
        return ResponseEntity.status(ex.getStatus())
                .body(ApiResponse.error(ex.getStatus().value(),
                        ex.getErrorCode(), ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<?>> handleValidation(
            MethodArgumentNotValidException ex) {
        Map<String, String> errors = new LinkedHashMap<>();
        ex.getBindingResult().getAllErrors().forEach(e ->
                errors.put(((FieldError) e).getField(),
                        e.getDefaultMessage()));
        return ResponseEntity.badRequest()
                .body(ApiResponse.<Map<String, String>>builder()
                        .status(400).errorCode("VALIDATION_FAILED")
                        .message("Validation failed").data(errors)
                        .timestamp(java.time.Instant.now().toString())
                        .build());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<?>> handleGeneral(Exception ex) {
        log.error("Unexpected error", ex);
        return ResponseEntity.status(500)
                .body(ApiResponse.error(500, "INTERNAL_ERROR",
                        "An unexpected error occurred"));
    }
}
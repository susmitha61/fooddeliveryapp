package com.fooddelivery.userservice.exception;

import com.fooddelivery.userservice.dto.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ApiResponse<?>> handleApiException(ApiException ex) {
        log.error("API Exception [{}]: {}", ex.getErrorCode(), ex.getMessage());
        return ResponseEntity.status(ex.getStatus())
                .body(ApiResponse.error(ex.getStatus().value(),
                        ex.getErrorCode(), ex.getMessage()));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<?>> handleAccessDenied(AccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error(403, "ACCESS_DENIED",
                        "You do not have permission to perform this action"));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<?>> handleValidation(
            MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = new LinkedHashMap<>();
        ex.getBindingResult().getAllErrors().forEach(e ->
                fieldErrors.put(((FieldError) e).getField(),
                        e.getDefaultMessage()));
        ApiResponse<?> body = ApiResponse.error(400,
                "VALIDATION_FAILED", "Validation failed");
        // inject fieldErrors into the response
        return ResponseEntity.badRequest().body(
                ApiResponse.<Map<String,String>>builder()
                        .status(400)
                        .errorCode("VALIDATION_FAILED")
                        .message("Validation failed")
                        .data(fieldErrors)
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
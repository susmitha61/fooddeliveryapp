package com.fooddelivery.paymentservice.controller;

import com.fooddelivery.paymentservice.dto.*;
import com.fooddelivery.paymentservice.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
@Tag(name = "Payments", description = "BRD Use Case 4 — Payment Processing")
public class PaymentController {

    private final PaymentService paymentService;

    // ── BRD UC4: Initiate payment ──────────────────────────
    // Called right after order is placed
    @PostMapping("/initiate")
    @Operation(summary = "Initiate payment for a placed order (UC4)")
    public ResponseEntity<ApiResponse<PaymentResponse>> initiatePayment(
            @RequestHeader("X-User-Id") String userId,
            @Valid @RequestBody InitiatePaymentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Payment initiated",
                        paymentService.initiatePayment(userId, request)));
    }

    // Confirm online payment (UPI/Card callback)
    @PatchMapping("/{paymentId}/confirm")
    @Operation(summary = "Confirm online payment after gateway callback")
    public ResponseEntity<ApiResponse<PaymentResponse>> confirmPayment(
            @PathVariable String paymentId,
            @RequestParam String transactionRef,
            @RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.ok(ApiResponse.success("Payment confirmed",
                paymentService.confirmPayment(paymentId,
                        transactionRef, userId)));
    }

    // Mark payment failed (gateway callback)
    @PatchMapping("/{paymentId}/fail")
    @Operation(summary = "Mark payment as failed")
    public ResponseEntity<ApiResponse<PaymentResponse>> failPayment(
            @PathVariable String paymentId,
            @RequestParam String reason,
            @RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.ok(ApiResponse.success("Payment marked failed",
                paymentService.failPayment(paymentId, reason, userId)));
    }

    // Get payment by ID
    @GetMapping("/{paymentId}")
    @Operation(summary = "Get payment details by payment ID")
    public ResponseEntity<ApiResponse<PaymentResponse>> getPayment(
            @PathVariable String paymentId) {
        return ResponseEntity.ok(
                ApiResponse.success(
                        paymentService.getPaymentById(paymentId)));
    }

    // Get payment for an order
    @GetMapping("/order/{orderId}")
    @Operation(summary = "Get payment status for an order")
    public ResponseEntity<ApiResponse<PaymentResponse>> getByOrder(
            @PathVariable String orderId) {
        return ResponseEntity.ok(
                ApiResponse.success(
                        paymentService.getPaymentByOrderId(orderId)));
    }

    // Payment history
    @GetMapping("/my-payments")
    @Operation(summary = "Get payment history for logged-in user")
    public ResponseEntity<ApiResponse<Page<PaymentResponse>>> myPayments(
            @RequestHeader("X-User-Id") String userId,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success(
                paymentService.getPaymentHistory(userId, page, size)));
    }

    // Refund — when order is cancelled after payment
    @PostMapping("/refund/{orderId}")
    @Operation(summary = "Process refund for cancelled order")
    public ResponseEntity<ApiResponse<PaymentResponse>> refund(
            @PathVariable String orderId,
            @RequestParam(defaultValue = "Order cancelled") String reason,
            @RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.ok(ApiResponse.success("Refund processed",
                paymentService.processRefund(orderId, reason, userId)));
    }

    // COD — mark paid on delivery (driver/restaurant calls this)
    @PatchMapping("/cod/{orderId}/mark-paid")
    @Operation(summary = "Mark COD payment as collected on delivery")
    public ResponseEntity<ApiResponse<PaymentResponse>> markCodPaid(
            @PathVariable String orderId,
            @RequestHeader("X-User-Id") String updatedBy) {
        return ResponseEntity.ok(ApiResponse.success("COD payment collected",
                paymentService.markCodPaid(orderId, updatedBy)));
    }
}
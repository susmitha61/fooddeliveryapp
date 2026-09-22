package com.fooddelivery.paymentservice.service;

import com.fooddelivery.paymentservice.dto.*;
import com.fooddelivery.paymentservice.entity.Payment;
import org.springframework.data.domain.Page;

public interface PaymentService {

    // BRD UC4 — Initiate payment after order is placed
    PaymentResponse initiatePayment(String userId,
                                     InitiatePaymentRequest request);

    // Confirm payment (for online payments — after gateway callback)
    PaymentResponse confirmPayment(String paymentId, String transactionRef,
                                    String updatedBy);

    // Mark payment failed
    PaymentResponse failPayment(String paymentId, String reason,
                                 String updatedBy);

    // Get payment by ID
    PaymentResponse getPaymentById(String paymentId);

    // Get payment for an order
    PaymentResponse getPaymentByOrderId(String orderId);

    // Payment history for user
    Page<PaymentResponse> getPaymentHistory(String userId,
                                              int page, int size);

    // Process refund — called when order is cancelled after payment
    PaymentResponse processRefund(String orderId, String reason,
                                   String updatedBy);

    // COD — mark as paid when delivered
    PaymentResponse markCodPaid(String orderId, String updatedBy);
}
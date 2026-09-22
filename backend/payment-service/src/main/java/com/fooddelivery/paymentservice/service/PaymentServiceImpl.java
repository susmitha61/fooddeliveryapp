package com.fooddelivery.paymentservice.service;

import com.fooddelivery.paymentservice.client.AuthServiceClient;
import com.fooddelivery.paymentservice.client.OrderServiceClient;
import com.fooddelivery.paymentservice.dto.*;
import com.fooddelivery.paymentservice.dto.kafka.PaymentResultEvent;
import com.fooddelivery.paymentservice.entity.Payment;
import com.fooddelivery.paymentservice.exception.ApiException;
import com.fooddelivery.paymentservice.kafka.PaymentEventProducer;
import com.fooddelivery.paymentservice.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepo;
    private final PaymentEventProducer eventProducer;
    private final AuthServiceClient authServiceClient;
    private final OrderServiceClient orderServiceClient;

    // ── BRD UC4: Initiate payment ──────────────────────────

    @Override
    public PaymentResponse initiatePayment(String userId,
                                            InitiatePaymentRequest request) {
        // 1. Validate user exists in auth-service
        validateUserExists(userId);

        // 2. Validate order exists in order-service
        Map<String, Object> orderData = validateAndGetOrder(
                request.getOrderId(), userId);

        // 3. Prevent duplicate payment
        if (paymentRepo.existsByOrderIdAndStatus(
                request.getOrderId(), Payment.PaymentStatus.SUCCESS))
            throw new ApiException(
                    "Payment already completed for this order",
                    HttpStatus.CONFLICT, "PAYMENT_ALREADY_DONE");

        // 4. Extract order details
        String restaurantId = extractString(orderData, "data", "restaurantId");
        Double orderAmount   = extractDouble(orderData, "data", "totalAmount");

        // 5. Validate amount matches
        if (Math.abs(orderAmount - request.getAmount()) > 0.01)
            throw new ApiException(
                    "Payment amount does not match order total. " +
                    "Expected: " + orderAmount,
                    HttpStatus.BAD_REQUEST, "AMOUNT_MISMATCH");

        // 6. Create payment record
        Payment payment = Payment.builder()
                .orderId(request.getOrderId())
                .userId(userId)
                .restaurantId(restaurantId)
                .amount(request.getAmount())
                .paymentMethod(request.getPaymentMethod())
                .status(Payment.PaymentStatus.PENDING)
                .updatedBy(userId)
                .build();

        Payment saved = paymentRepo.save(payment);
        log.info("Payment initiated: {} for orderId: {} method: {}",
                saved.getId(), request.getOrderId(),
                request.getPaymentMethod());

        // 7. For COD — auto-confirm immediately
        if (request.getPaymentMethod() == Payment.PaymentMethod.CASH_ON_DELIVERY) {
            return processSuccessfulPayment(saved, "COD-" + saved.getId(), userId);
        }

        // For online payments — return PENDING, wait for confirmPayment call
        return PaymentResponse.from(saved);
    }

    // ── Confirm online payment ─────────────────────────────

    @Override
    public PaymentResponse confirmPayment(String paymentId,
                                           String transactionRef,
                                           String updatedBy) {
        Payment payment = getPaymentOrThrow(paymentId);

        if (payment.getStatus() == Payment.PaymentStatus.SUCCESS)
            throw new ApiException("Payment already confirmed",
                    HttpStatus.CONFLICT, "ALREADY_CONFIRMED");

        if (payment.getStatus() == Payment.PaymentStatus.CANCELLED
                || payment.getStatus() == Payment.PaymentStatus.FAILED)
            throw new ApiException(
                    "Payment cannot be confirmed — status: "
                    + payment.getStatus(),
                    HttpStatus.BAD_REQUEST, "INVALID_STATUS");

        return processSuccessfulPayment(payment, transactionRef, updatedBy);
    }

    // ── Fail payment ───────────────────────────────────────

    @Override
    public PaymentResponse failPayment(String paymentId, String reason,
                                        String updatedBy) {
        Payment payment = getPaymentOrThrow(paymentId);

        if (payment.getStatus() != Payment.PaymentStatus.PENDING)
            throw new ApiException(
                    "Only PENDING payments can be marked as failed",
                    HttpStatus.BAD_REQUEST, "INVALID_STATUS");

        payment.setStatus(Payment.PaymentStatus.FAILED);
        payment.setFailureReason(reason);
        payment.setUpdatedBy(updatedBy);
        Payment saved = paymentRepo.save(payment);

        // Publish failed event → order-service marks order as PAYMENT_FAILED
        eventProducer.publishPaymentFailed(buildEvent(saved, "FAILED"));
        log.info("Payment failed: {} orderId: {} reason: {}",
                paymentId, payment.getOrderId(), reason);

        return PaymentResponse.from(saved);
    }

    // ── Queries ────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public PaymentResponse getPaymentById(String paymentId) {
        return PaymentResponse.from(getPaymentOrThrow(paymentId));
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentResponse getPaymentByOrderId(String orderId) {
        return paymentRepo.findByOrderId(orderId)
                .map(PaymentResponse::from)
                .orElseThrow(() -> new ApiException(
                        "Payment not found for order: " + orderId,
                        HttpStatus.NOT_FOUND, "PAYMENT_NOT_FOUND"));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PaymentResponse> getPaymentHistory(String userId,
                                                    int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return paymentRepo.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(PaymentResponse::from);
    }

    // ── Refund ─────────────────────────────────────────────

    @Override
    public PaymentResponse processRefund(String orderId, String reason,
                                          String updatedBy) {
        Payment payment = paymentRepo.findSuccessfulPaymentByOrderId(orderId)
                .orElseThrow(() -> new ApiException(
                        "No successful payment found for order: " + orderId,
                        HttpStatus.NOT_FOUND, "PAYMENT_NOT_FOUND"));

        if (payment.getStatus() == Payment.PaymentStatus.REFUNDED)
            throw new ApiException("Refund already processed",
                    HttpStatus.CONFLICT, "ALREADY_REFUNDED");

        // COD refunds are not applicable
        if (payment.getPaymentMethod() == Payment.PaymentMethod.CASH_ON_DELIVERY)
            throw new ApiException(
                    "Refunds not applicable for Cash on Delivery orders",
                    HttpStatus.BAD_REQUEST, "COD_NO_REFUND");

        payment.setStatus(Payment.PaymentStatus.REFUNDED);
        payment.setRefundId("REF-" + UUID.randomUUID().toString()
                .substring(0, 8).toUpperCase());
        payment.setRefundedAmount(payment.getAmount());
        payment.setRefundedAt(LocalDateTime.now());
        payment.setUpdatedBy(updatedBy);
        payment.setFailureReason(reason);

        Payment saved = paymentRepo.save(payment);

        // Publish refund event
        eventProducer.publishRefund(buildEvent(saved, "REFUNDED"));
        log.info("Refund processed: {} for orderId: {} refundId: {}",
                saved.getId(), orderId, saved.getRefundId());

        return PaymentResponse.from(saved);
    }

    // ── COD: Mark paid on delivery ─────────────────────────

    @Override
    public PaymentResponse markCodPaid(String orderId, String updatedBy) {
        Payment payment = paymentRepo.findByOrderId(orderId)
                .orElseThrow(() -> new ApiException(
                        "Payment not found for order: " + orderId,
                        HttpStatus.NOT_FOUND, "PAYMENT_NOT_FOUND"));

        if (payment.getPaymentMethod() != Payment.PaymentMethod.CASH_ON_DELIVERY)
            throw new ApiException("Not a COD order",
                    HttpStatus.BAD_REQUEST, "NOT_COD");

        if (payment.getStatus() == Payment.PaymentStatus.SUCCESS)
            throw new ApiException("Payment already marked as paid",
                    HttpStatus.CONFLICT, "ALREADY_PAID");

        payment.setStatus(Payment.PaymentStatus.SUCCESS);
        payment.setPaidAt(LocalDateTime.now());
        payment.setUpdatedBy(updatedBy);
        payment.setTransactionRef("COD-DELIVERED-" + orderId);

        Payment saved = paymentRepo.save(payment);
        log.info("COD payment marked as paid for orderId: {}", orderId);
        return PaymentResponse.from(saved);
    }

    // ── Private helpers ────────────────────────────────────

    private PaymentResponse processSuccessfulPayment(Payment payment,
                                                   String transactionRef,
                                                   String updatedBy) {
    payment.setStatus(Payment.PaymentStatus.SUCCESS);
    payment.setTransactionRef(transactionRef);
    payment.setPaidAt(LocalDateTime.now());
    payment.setUpdatedBy(updatedBy);

    Payment saved = paymentRepo.save(payment);

    // Notify order-service via internal endpoint (no auth needed)
    try {
        orderServiceClient.markPaymentDone(saved.getOrderId());
        log.info("Order-service notified — orderId: {}", saved.getOrderId());
    } catch (Exception e) {
        log.error("Failed to notify order-service: {}", e.getMessage());
        // Kafka as backup
    }

    eventProducer.publishPaymentSuccess(buildEvent(saved, "SUCCESS"));

    log.info("Payment SUCCESS: {} orderId: {} txnRef: {}",
            saved.getId(), saved.getOrderId(), transactionRef);

    return PaymentResponse.from(saved);
}

    private void validateUserExists(String userId) {
        try {
            Boolean exists = authServiceClient.userExists(userId);
            if (exists == null || !exists)
                throw new ApiException("User not found: " + userId,
                        HttpStatus.NOT_FOUND, "USER_NOT_FOUND");
        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            log.warn("Auth-service validation failed: {} — continuing",
                    e.getMessage());
        }
    }

@SuppressWarnings("unchecked")
private Map<String, Object> validateAndGetOrder(String orderId,
                                                  String userId) {
    try {
        // Use internal endpoint — no auth header needed
        Map<String, Object> orderData =
                orderServiceClient.getOrderInternal(orderId);

        if (orderData == null)
            throw new ApiException("Order not found: " + orderId,
                    HttpStatus.NOT_FOUND, "ORDER_NOT_FOUND");

        // Verify order belongs to this user
        Object dataObj = orderData.get("data");
        if (dataObj instanceof Map) {
            Map<String, Object> data = (Map<String, Object>) dataObj;

            String orderUserId = data.get("userId") != null
                    ? data.get("userId").toString() : "";
            if (!userId.equals(orderUserId))
                throw new ApiException("Order does not belong to this user",
                        HttpStatus.FORBIDDEN, "ACCESS_DENIED");

            String orderStatus = data.get("status") != null
                    ? data.get("status").toString() : "";
            if ("CANCELLED".equals(orderStatus)
                    || "DELIVERED".equals(orderStatus))
                throw new ApiException(
                        "Cannot process payment — order status: " + orderStatus,
                        HttpStatus.BAD_REQUEST, "INVALID_ORDER_STATUS");
        }
        return orderData;

    } catch (ApiException e) {
        throw e;
    } catch (Exception e) {
        log.error("Order validation failed for orderId: {} error: {}",
                orderId, e.getMessage());
        throw new ApiException("Order not found or service unavailable",
                HttpStatus.NOT_FOUND, "ORDER_NOT_FOUND");
    }
}
   
    private Payment getPaymentOrThrow(String paymentId) {
        return paymentRepo.findById(paymentId)
                .orElseThrow(() -> new ApiException(
                        "Payment not found: " + paymentId,
                        HttpStatus.NOT_FOUND, "PAYMENT_NOT_FOUND"));
    }

    private PaymentResultEvent buildEvent(Payment p, String status) {
        return PaymentResultEvent.builder()
                .paymentId(p.getId())
                .orderId(p.getOrderId())
                .userId(p.getUserId())
                .restaurantId(p.getRestaurantId())
                .amount(p.getAmount())
                .status(status)
                .paymentMethod(p.getPaymentMethod().name())
                .failureReason(p.getFailureReason())
                .transactionRef(p.getTransactionRef())
                .build();
    }

    @SuppressWarnings("unchecked")
    private String extractString(Map<String, Object> map, String... keys) {
        Object current = map;
        for (String key : keys) {
            if (current instanceof Map)
                current = ((Map<String, Object>) current).get(key);
            else return null;
        }
        return current != null ? current.toString() : null;
    }

    @SuppressWarnings("unchecked")
    private Double extractDouble(Map<String, Object> map, String... keys) {
        Object current = map;
        for (String key : keys) {
            if (current instanceof Map)
                current = ((Map<String, Object>) current).get(key);
            else return 0.0;
        }
        return current instanceof Number
                ? ((Number) current).doubleValue() : 0.0;
    }
}
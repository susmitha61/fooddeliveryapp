package com.fooddelivery.paymentservice.repository;

import com.fooddelivery.paymentservice.entity.Payment;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, String> {

    // Get payment by order — one order has one payment
    Optional<Payment> findByOrderId(String orderId);

    // All payments for a user
    Page<Payment> findByUserIdOrderByCreatedAtDesc(
            String userId, Pageable pageable);

    // All payments for a user by status
    List<Payment> findByUserIdAndStatus(
            String userId, Payment.PaymentStatus status);

    // Check if successful payment exists for order
    boolean existsByOrderIdAndStatus(
            String orderId, Payment.PaymentStatus status);

    // Payments that need refund processing
    @Query("SELECT p FROM Payment p WHERE p.orderId = :orderId " +
           "AND p.status = 'SUCCESS'")
    Optional<Payment> findSuccessfulPaymentByOrderId(
            @Param("orderId") String orderId);
}
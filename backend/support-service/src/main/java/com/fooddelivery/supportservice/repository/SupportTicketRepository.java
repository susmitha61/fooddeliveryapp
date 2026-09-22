package com.fooddelivery.supportservice.repository;

import com.fooddelivery.supportservice.entity.SupportTicket;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface SupportTicketRepository
        extends JpaRepository<SupportTicket, String> {

    // User's own tickets
    Page<SupportTicket> findByUserIdOrderByCreatedAtDesc(
            String userId, Pageable pageable);

    // Filter by status (for agents/admin)
    Page<SupportTicket> findByStatusOrderByCreatedAtDesc(
            SupportTicket.TicketStatus status, Pageable pageable);

    // Filter by category
    Page<SupportTicket> findByCategoryOrderByCreatedAtDesc(
            SupportTicket.TicketCategory category, Pageable pageable);

    // All tickets paginated (admin)
    Page<SupportTicket> findAllByOrderByCreatedAtDesc(Pageable pageable);

    // User + status filter
    Page<SupportTicket> findByUserIdAndStatusOrderByCreatedAtDesc(
            String userId, SupportTicket.TicketStatus status, Pageable pageable);

    // By ticket number
    Optional<SupportTicket> findByTicketNumber(String ticketNumber);

    // Verify ownership
    Optional<SupportTicket> findByIdAndUserId(String id, String userId);

    // Next ticket sequence for ticket number generation
    @Query("SELECT COUNT(t) FROM SupportTicket t " +
           "WHERE YEAR(t.createdAt) = YEAR(CURRENT_DATE)")
    long countThisYear();
}
package com.fooddelivery.supportservice.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "support_tickets", indexes = {
    @Index(name = "idx_ticket_user",   columnList = "user_id"),
    @Index(name = "idx_ticket_order",  columnList = "order_id"),
    @Index(name = "idx_ticket_status", columnList = "status")
})
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class SupportTicket {

    @Id
    @Column(name = "ticket_id", length = 36)
    @Builder.Default
    private String id = UUID.randomUUID().toString();

    // Human-readable ticket number e.g. TKT-2026-0001
    @Column(name = "ticket_number", unique = true, length = 20)
    private String ticketNumber;

    // ── Who raised it ─────────────────────────────────────
    @Column(name = "user_id", nullable = false, length = 36)
    private String userId;

    @Column(name = "user_name", length = 100)
    private String userName;

    @Column(name = "user_email", length = 150)
    private String userEmail;

    // ── What it's about ───────────────────────────────────
    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 30)
    private TicketCategory category;

    @Column(name = "order_id", length = 36)
    private String orderId;            // optional — if order-related

    @Column(name = "restaurant_id", length = 36)
    private String restaurantId;       // optional

    @Column(name = "subject", nullable = false, length = 200)
    private String subject;

    @Column(name = "description", nullable = false, length = 2000)
    private String description;

    // ── Status & Priority ─────────────────────────────────
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private TicketStatus status = TicketStatus.OPEN;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority", nullable = false, length = 10)
    @Builder.Default
    private Priority priority = Priority.MEDIUM;

    // Agent who is handling this ticket
    @Column(name = "assigned_to", length = 36)
    private String assignedTo;

    @Column(name = "resolution_note", length = 2000)
    private String resolutionNote;

    // Audit
    @Column(name = "updated_by", length = 36)
    private String updatedBy;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @Column(name = "closed_at")
    private LocalDateTime closedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "ticket",
               cascade = CascadeType.ALL,
               fetch = FetchType.LAZY,
               orphanRemoval = true)
    @OrderBy("createdAt ASC")
    @Builder.Default
    private List<TicketReply> replies = new ArrayList<>();

    // ── Enums ──────────────────────────────────────────────
    public enum TicketCategory {
        ORDER_ISSUE,         // Wrong item, missing item
        PAYMENT_ISSUE,       // Charged wrong, refund needed
        DELIVERY_ISSUE,      // Late delivery, delivery person issue
        FOOD_QUALITY,        // Food quality complaint
        APP_ISSUE,           // App bug/technical problem
        ACCOUNT_ISSUE,       // Account related
        REFUND_REQUEST,      // Explicit refund request
        OTHER
    }

    public enum TicketStatus {
        OPEN,           // Newly created
        IN_PROGRESS,    // Agent is handling it
        WAITING_USER,   // Agent replied, waiting for user response
        RESOLVED,       // Issue resolved
        CLOSED          // Closed without resolution / user closed it
    }

    public enum Priority { LOW, MEDIUM, HIGH, URGENT }
}
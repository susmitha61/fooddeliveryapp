package com.fooddelivery.supportservice.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "ticket_replies")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class TicketReply {

    @Id
    @Column(name = "reply_id", length = 36)
    @Builder.Default
    private String id = UUID.randomUUID().toString();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ticket_id", nullable = false)
    private SupportTicket ticket;

    // Who replied — userId (customer) or agentId (support agent/admin)
    @Column(name = "replied_by", nullable = false, length = 36)
    private String repliedBy;

    @Column(name = "replied_by_name", length = 100)
    private String repliedByName;

    @Enumerated(EnumType.STRING)
    @Column(name = "sender_type", nullable = false, length = 10)
    private SenderType senderType;

    @Column(name = "message", nullable = false, length = 2000)
    private String message;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public enum SenderType { USER, AGENT }
}
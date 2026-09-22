package com.fooddelivery.supportservice.dto.ticket;

import com.fooddelivery.supportservice.entity.*;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Data @Builder
@NoArgsConstructor @AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class TicketResponse {

    private String ticketId;
    private String ticketNumber;
    private String userId;
    private String userName;
    private String userEmail;
    private String category;
    private String orderId;
    private String restaurantId;
    private String subject;
    private String description;
    private String status;
    private String priority;
    private String assignedTo;
    private String resolutionNote;
    private String updatedBy;
    private List<ReplyResponse> replies;
    private LocalDateTime resolvedAt;
    private LocalDateTime closedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static TicketResponse from(SupportTicket t) {
        return TicketResponse.builder()
                .ticketId(t.getId())
                .ticketNumber(t.getTicketNumber())
                .userId(t.getUserId())
                .userName(t.getUserName())
                .userEmail(t.getUserEmail())
                .category(t.getCategory().name())
                .orderId(t.getOrderId())
                .restaurantId(t.getRestaurantId())
                .subject(t.getSubject())
                .description(t.getDescription())
                .status(t.getStatus().name())
                .priority(t.getPriority().name())
                .assignedTo(t.getAssignedTo())
                .resolutionNote(t.getResolutionNote())
                .updatedBy(t.getUpdatedBy())
                .replies(t.getReplies() != null
                        ? t.getReplies().stream()
                                .map(ReplyResponse::from)
                                .collect(Collectors.toList())
                        : List.of())
                .resolvedAt(t.getResolvedAt())
                .closedAt(t.getClosedAt())
                .createdAt(t.getCreatedAt())
                .updatedAt(t.getUpdatedAt())
                .build();
    }

    @Data @Builder
    @NoArgsConstructor @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ReplyResponse {
        private String replyId;
        private String repliedBy;
        private String repliedByName;
        private String senderType;
        private String message;
        private LocalDateTime createdAt;

        public static ReplyResponse from(TicketReply r) {
            return ReplyResponse.builder()
                    .replyId(r.getId())
                    .repliedBy(r.getRepliedBy())
                    .repliedByName(r.getRepliedByName())
                    .senderType(r.getSenderType().name())
                    .message(r.getMessage())
                    .createdAt(r.getCreatedAt())
                    .build();
        }
    }
}
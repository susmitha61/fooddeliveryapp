package com.fooddelivery.supportservice.repository;

import com.fooddelivery.supportservice.entity.TicketReply;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TicketReplyRepository
        extends JpaRepository<TicketReply, String> {

    List<TicketReply> findByTicketIdOrderByCreatedAtAsc(String ticketId);
}
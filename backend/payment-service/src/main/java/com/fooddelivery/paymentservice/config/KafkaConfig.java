package com.fooddelivery.paymentservice.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
public class KafkaConfig {

    @Bean public NewTopic paymentSuccessTopic() {
        return TopicBuilder.name("payment-success-topic")
                .partitions(3).replicas(1).build();
    }

    @Bean public NewTopic paymentFailedTopic() {
        return TopicBuilder.name("payment-failed-topic")
                .partitions(3).replicas(1).build();
    }

    @Bean public NewTopic paymentRefundTopic() {
        return TopicBuilder.name("payment-refund-topic")
                .partitions(3).replicas(1).build();
    }
}
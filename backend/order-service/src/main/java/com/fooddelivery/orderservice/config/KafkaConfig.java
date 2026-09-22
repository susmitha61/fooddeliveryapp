package com.fooddelivery.orderservice.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.config.TopicBuilder;
import org.springframework.kafka.core.*;
import org.springframework.kafka.listener.DefaultErrorHandler;
import org.springframework.kafka.support.serializer.ErrorHandlingDeserializer;
import org.springframework.util.backoff.FixedBackOff;
import java.util.HashMap;
import java.util.Map;

@Configuration
public class KafkaConfig {

    @Value("${spring.kafka.bootstrap-servers}")
    private String bootstrapServers;

    // ── Topics ─────────────────────────────────────────────

    @Bean public NewTopic orderPlacedTopic() {
        return TopicBuilder.name("order-placed-topic")
                .partitions(3).replicas(1).build();
    }
    @Bean public NewTopic orderConfirmedTopic() {
        return TopicBuilder.name("order-confirmed-topic")
                .partitions(3).replicas(1).build();
    }
    @Bean public NewTopic orderCancelledTopic() {
        return TopicBuilder.name("order-cancelled-topic")
                .partitions(3).replicas(1).build();
    }
    @Bean public NewTopic trackingUpdateTopic() {
        return TopicBuilder.name("tracking-update-topic")
                .partitions(3).replicas(1).build();
    }
    @Bean public NewTopic orderStatusUpdatedTopic() {
        return TopicBuilder.name("order-status-updated-topic")
                .partitions(3).replicas(1).build();
    }

    // ── Consumer factory with ErrorHandlingDeserializer ────

    @Bean
    public ConsumerFactory<String, String> consumerFactory() {
        Map<String, Object> props = new HashMap<>();
        props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        props.put(ConsumerConfig.GROUP_ID_CONFIG, "order-group");
        props.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");

        // Wrap with ErrorHandlingDeserializer so bad messages don't crash consumer
        props.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG,
                ErrorHandlingDeserializer.class);
        props.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG,
                ErrorHandlingDeserializer.class);
        props.put(ErrorHandlingDeserializer.KEY_DESERIALIZER_CLASS,
                StringDeserializer.class);
        props.put(ErrorHandlingDeserializer.VALUE_DESERIALIZER_CLASS,
                StringDeserializer.class);

        return new DefaultKafkaConsumerFactory<>(props);
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, String>
            kafkaListenerContainerFactory() {

        ConcurrentKafkaListenerContainerFactory<String, String> factory =
                new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(consumerFactory());

        // Retry 3 times with 1s gap, then skip the bad message
        factory.setCommonErrorHandler(
                new DefaultErrorHandler(new FixedBackOff(1000L, 3)));

        return factory;
    }
}
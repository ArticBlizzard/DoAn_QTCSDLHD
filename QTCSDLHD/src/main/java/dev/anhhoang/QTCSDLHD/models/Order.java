package dev.anhhoang.QTCSDLHD.models;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Document(collection = "orders")
public class Order {
    @Id
    private String _id;
    private String customer_id;
    private List<OrderItem> items;
    private Double total;
    private String status;
    private String shipping_address;
    private String payment_method;
    private LocalDateTime created_at;
    private LocalDateTime updated_at;
}
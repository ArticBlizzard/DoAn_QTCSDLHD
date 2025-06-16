package dev.anhhoang.QTCSDLHD.models;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Document(collection = "customers")
public class Customer {
    @Id
    private String _id;
    private String name;
    private String email;
    private String password;
    private String rank;
    private String address;
    private List<CartItem> cart;
    private List<String> orders;
    private LocalDateTime created_at;
    private LocalDateTime updated_at;
}
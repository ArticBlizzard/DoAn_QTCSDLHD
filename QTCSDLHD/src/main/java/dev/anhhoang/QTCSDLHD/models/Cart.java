package dev.anhhoang.QTCSDLHD.models;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;

@Document(collection = "carts")
@Data
public class Cart implements Serializable {
    private static final long serialVersionUID = 1L;
    
    @Id
    private String _id;
    private String customerId;
    private String userId; // For Redis cache
    private List<CartItem> items = new ArrayList<>();
    private String status; // active, checked_out, etc.
    private double total = 0.0;
    private LocalDateTime created_at;
    private LocalDateTime updated_at;
}
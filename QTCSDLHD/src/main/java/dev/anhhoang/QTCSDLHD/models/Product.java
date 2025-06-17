package dev.anhhoang.QTCSDLHD.models;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Document(collection = "products")
public class Product {
    @Id
    private String _id;
    private String name;
    private String description;
    private Double price;
    private Integer stock;
    private String image_url;
    private String category;
    private String shop_id;
    private String shop_name;
    private LocalDateTime created_at;
    private LocalDateTime updated_at;
}
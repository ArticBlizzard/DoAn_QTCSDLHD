package dev.anhhoang.QTCSDLHD.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ProductResponse {
    private String _id;
    private String name;
    private String description;
    private Double price;
    private Integer stock;
    private String image_url;
    private String category;
    private String shop_id;
    private String shop_name;
    private Integer quantity;
    private LocalDateTime created_at;
    private LocalDateTime updated_at;
}
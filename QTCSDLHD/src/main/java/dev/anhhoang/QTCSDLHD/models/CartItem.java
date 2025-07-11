package dev.anhhoang.QTCSDLHD.models;

import lombok.Data;
import java.io.Serializable;

@Data
public class CartItem implements Serializable {
    private static final long serialVersionUID = 1L;
    
    private String product_id;
    private String productId; // For Redis cache
    private String productName;
    private Double price;
    private int quantity;
    private String imageUrl;
    private String shopId;
    private String shopName;
}
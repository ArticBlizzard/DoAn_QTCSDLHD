package dev.anhhoang.QTCSDLHD.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class OrderStatusResponse {
    private String orderId;
    private String status;
    private String fullName;
    private String phoneNumber;
    private String shipping_address;
    private String payment_method;
    private double total;
    private LocalDateTime created_at;
    private LocalDateTime updated_at;
    private List<OrderItemResponse> items;
    
    @Data
    public static class OrderItemResponse {
        private String productId;
        private String productName;
        private String productImage;
        private Double price;
        private Integer quantity;
        private String shopName;
        private Double subtotal;
    }
}

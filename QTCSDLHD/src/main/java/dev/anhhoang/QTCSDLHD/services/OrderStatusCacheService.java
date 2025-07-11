package dev.anhhoang.QTCSDLHD.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.concurrent.TimeUnit;

@Service
public class OrderStatusCacheService {

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    private static final String ORDER_STATUS_KEY_PREFIX = "order_status:";
    private static final String USER_ORDERS_KEY_PREFIX = "user_orders:";
    private static final long ORDER_STATUS_EXPIRY_DAYS = 30;

    public void cacheOrderStatus(String orderId, String customerId, String status, String shopName) {
        // Cache order status
        String orderKey = ORDER_STATUS_KEY_PREFIX + orderId;
        OrderStatusInfo statusInfo = new OrderStatusInfo();
        statusInfo.setOrderId(orderId);
        statusInfo.setCustomerId(customerId);
        statusInfo.setStatus(status);
        statusInfo.setShopName(shopName);
        statusInfo.setUpdatedAt(LocalDateTime.now());
        
        redisTemplate.opsForValue().set(orderKey, statusInfo, ORDER_STATUS_EXPIRY_DAYS, TimeUnit.DAYS);
        
        // Cache user's orders list
        String userOrdersKey = USER_ORDERS_KEY_PREFIX + customerId;
        redisTemplate.opsForList().leftPush(userOrdersKey, orderId);
        redisTemplate.expire(userOrdersKey, ORDER_STATUS_EXPIRY_DAYS, TimeUnit.DAYS);
        
        System.out.println("📊 REDIS ORDER STATUS CACHED:");
        System.out.println("   Order ID: " + orderId);
        System.out.println("   Customer ID: " + customerId);
        System.out.println("   Status: " + status);
        System.out.println("   Shop: " + shopName);
        System.out.println("   Cached at: " + LocalDateTime.now());
    }

    public OrderStatusInfo getOrderStatus(String orderId) {
        String orderKey = ORDER_STATUS_KEY_PREFIX + orderId;
        return (OrderStatusInfo) redisTemplate.opsForValue().get(orderKey);
    }

    public static class OrderStatusInfo {
        private String orderId;
        private String customerId;
        private String status;
        private String shopName;
        private LocalDateTime updatedAt;

        // Getters and setters
        public String getOrderId() { return orderId; }
        public void setOrderId(String orderId) { this.orderId = orderId; }
        
        public String getCustomerId() { return customerId; }
        public void setCustomerId(String customerId) { this.customerId = customerId; }
        
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        
        public String getShopName() { return shopName; }
        public void setShopName(String shopName) { this.shopName = shopName; }
        
        public LocalDateTime getUpdatedAt() { return updatedAt; }
        public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    }
}

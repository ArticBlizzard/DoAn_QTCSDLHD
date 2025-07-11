package dev.anhhoang.QTCSDLHD.controllers;

import dev.anhhoang.QTCSDLHD.services.OrderStatusCacheService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/order-status")
@CrossOrigin(origins = "http://localhost:3000")
public class OrderStatusController {

    @Autowired
    private OrderStatusCacheService orderStatusCacheService;

    @GetMapping("/{orderId}")
    public ResponseEntity<?> getOrderStatus(@PathVariable String orderId, Principal principal) {
        try {
            if (principal == null) {
                return ResponseEntity.status(401).body("User not authenticated");
            }

            OrderStatusCacheService.OrderStatusInfo statusInfo = orderStatusCacheService.getOrderStatus(orderId);
            
            if (statusInfo == null) {
                return ResponseEntity.notFound().build();
            }

            return ResponseEntity.ok(statusInfo);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error getting order status: " + e.getMessage());
        }
    }

    @GetMapping("/test/{orderId}")
    public ResponseEntity<?> getOrderStatusTest(@PathVariable String orderId) {
        try {
            OrderStatusCacheService.OrderStatusInfo statusInfo = orderStatusCacheService.getOrderStatus(orderId);
            
            if (statusInfo == null) {
                return ResponseEntity.notFound().build();
            }

            return ResponseEntity.ok(statusInfo);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error getting order status: " + e.getMessage());
        }
    }
}

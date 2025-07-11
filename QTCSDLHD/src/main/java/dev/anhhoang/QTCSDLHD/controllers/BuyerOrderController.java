package dev.anhhoang.QTCSDLHD.controllers;

import dev.anhhoang.QTCSDLHD.models.Order;
import dev.anhhoang.QTCSDLHD.repositories.OrderRepository;
import dev.anhhoang.QTCSDLHD.services.UserService;
import dev.anhhoang.QTCSDLHD.services.OrderStatusService;
import dev.anhhoang.QTCSDLHD.dto.UserProfileResponse;
import dev.anhhoang.QTCSDLHD.dto.OrderStatusResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/buyer/orders")
@CrossOrigin(origins = "http://localhost:3000")
public class BuyerOrderController {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private OrderStatusService orderStatusService;

    @GetMapping
    public ResponseEntity<?> getBuyerOrders(Principal principal) {
        try {
            if (principal == null) {
                return ResponseEntity.status(401).body("User not authenticated");
            }

            UserProfileResponse userProfile = userService.findUserProfileByEmail(principal.getName());
            String userId = userProfile.getId();

            List<Order> orders = orderRepository.findByCustomer_idOrderByCreated_atDesc(userId);
            List<OrderStatusResponse> orderResponses = orderStatusService.convertToOrderStatusResponseList(orders);
            return ResponseEntity.ok(orderResponses);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error getting buyer orders: " + e.getMessage());
        }
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<?> getBuyerOrderById(@PathVariable String orderId, Principal principal) {
        try {
            if (principal == null) {
                return ResponseEntity.status(401).body("User not authenticated");
            }

            UserProfileResponse userProfile = userService.findUserProfileByEmail(principal.getName());
            String userId = userProfile.getId();

            Optional<Order> orderOpt = orderRepository.findById(orderId);
            if (orderOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            Order order = orderOpt.get();
            // Verify that this order belongs to the authenticated user
            if (!order.getCustomer_id().equals(userId)) {
                return ResponseEntity.status(403).body("Access denied");
            }

            OrderStatusResponse orderResponse = orderStatusService.convertToOrderStatusResponse(order);
            return ResponseEntity.ok(orderResponse);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error getting order: " + e.getMessage());
        }
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<?> getBuyerOrdersByStatus(@PathVariable String status, Principal principal) {
        try {
            if (principal == null) {
                return ResponseEntity.status(401).body("User not authenticated");
            }

            UserProfileResponse userProfile = userService.findUserProfileByEmail(principal.getName());
            String userId = userProfile.getId();

            // Chuyển đổi status từ frontend sang backend format
            String backendStatus = convertFrontendStatusToBackend(status);
            
            List<Order> orders = orderRepository.findByCustomer_idAndStatus(userId, backendStatus);
            List<OrderStatusResponse> orderResponses = orderStatusService.convertToOrderStatusResponseList(orders);
            return ResponseEntity.ok(orderResponses);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error getting orders by status: " + e.getMessage());
        }
    }
    
    private String convertFrontendStatusToBackend(String frontendStatus) {
        switch (frontendStatus.toLowerCase()) {
            case "pending":
                return "PENDING";
            case "confirmed":
                return "CONFIRMED";
            case "processing":
                return "CONFIRMED"; // processing = confirmed trong backend
            case "shipped":
                return "SHIPPING";
            case "delivered":
                return "DELIVERED";
            case "cancelled":
                return "CANCELLED";
            default:
                return frontendStatus.toUpperCase();
        }
    }

    @PutMapping("/{orderId}/cancel")
    public ResponseEntity<?> cancelOrder(@PathVariable String orderId, Principal principal) {
        try {
            if (principal == null) {
                return ResponseEntity.status(401).body("User not authenticated");
            }

            UserProfileResponse userProfile = userService.findUserProfileByEmail(principal.getName());
            String userId = userProfile.getId();

            Optional<Order> orderOpt = orderRepository.findById(orderId);
            if (orderOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            Order order = orderOpt.get();
            
            // Verify that this order belongs to the authenticated user
            if (!order.getCustomer_id().equals(userId)) {
                return ResponseEntity.status(403).body("Access denied");
            }

            // Only allow cancellation if order is still pending
            if (!"pending".equals(order.getStatus())) {
                return ResponseEntity.badRequest().body("Order cannot be cancelled. Current status: " + order.getStatus());
            }

            order.setStatus("cancelled");
            order.setUpdated_at(java.time.LocalDateTime.now());
            orderRepository.save(order);

            return ResponseEntity.ok("Order cancelled successfully");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error cancelling order: " + e.getMessage());
        }
    }
}

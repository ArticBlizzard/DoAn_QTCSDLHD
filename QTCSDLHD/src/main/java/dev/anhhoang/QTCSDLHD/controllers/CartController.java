package dev.anhhoang.QTCSDLHD.controllers;

import dev.anhhoang.QTCSDLHD.models.Cart;
import dev.anhhoang.QTCSDLHD.services.CartCacheService;
import dev.anhhoang.QTCSDLHD.services.UserService;
import dev.anhhoang.QTCSDLHD.dto.UserProfileResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/api/cart")
@CrossOrigin(origins = "http://localhost:3000")
public class CartController {

    @Autowired
    private CartCacheService cartCacheService;

    @Autowired
    private UserService userService;

    @GetMapping("/redis-test/{userId}")
    public ResponseEntity<?> testRedisCart(@PathVariable String userId) {
        try {
            // Test adding item directly
            Cart testCart = cartCacheService.addItemToCart(userId, "test-product-id", 1);
            
            // Verify by retrieving
            Cart retrievedCart = cartCacheService.getCart(userId);
            
            return ResponseEntity.ok(Map.of(
                "savedCart", testCart,
                "retrievedCart", retrievedCart,
                "redisWorking", testCart.getItems().size() == retrievedCart.getItems().size()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Redis test failed: " + e.getMessage());
        }
    }

    @GetMapping("/test")
    public ResponseEntity<?> getTestCart() {
        try {
            // Test với một user ID cố định để debug
            String testUserId = "test-user-id";
            Cart cart = cartCacheService.getCart(testUserId);
            return ResponseEntity.ok(cart);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error getting test cart: " + e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<?> getCart(Principal principal) {
        try {
            if (principal == null) {
                return ResponseEntity.status(401).body("User not authenticated");
            }

            UserProfileResponse userProfile = userService.findUserProfileByEmail(principal.getName());
            String userId = userProfile.getId();

            Cart cart = cartCacheService.getCart(userId);
            return ResponseEntity.ok(cart);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error getting cart: " + e.getMessage());
        }
    }

    @PostMapping("/add")
    public ResponseEntity<?> addItemToCart(@RequestBody Map<String, Object> request, Principal principal) {
        try {
            if (principal == null) {
                return ResponseEntity.status(401).body("User not authenticated");
            }

            UserProfileResponse userProfile = userService.findUserProfileByEmail(principal.getName());
            String userId = userProfile.getId();

            String productId = (String) request.get("productId");
            Integer quantity = (Integer) request.get("quantity");

            if (productId == null || quantity == null || quantity <= 0) {
                return ResponseEntity.badRequest().body("Invalid product ID or quantity");
            }

            Cart cart = cartCacheService.addItemToCart(userId, productId, quantity);
            return ResponseEntity.ok(cart);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error adding item to cart: " + e.getMessage());
        }
    }

    @PutMapping("/update")
    public ResponseEntity<?> updateItemQuantity(@RequestBody Map<String, Object> request, Principal principal) {
        try {
            System.out.println("CartController: Update request received");
            System.out.println("Request body: " + request);
            
            if (principal == null) {
                return ResponseEntity.status(401).body("User not authenticated");
            }

            UserProfileResponse userProfile = userService.findUserProfileByEmail(principal.getName());
            String userId = userProfile.getId();

            String productId = (String) request.get("productId");
            Integer quantity = (Integer) request.get("quantity");

            System.out.println("ProductId: " + productId + ", Quantity: " + quantity);

            if (productId == null || quantity == null || quantity < 0) {
                System.out.println("Invalid productId or quantity");
                return ResponseEntity.badRequest().body("Invalid product ID or quantity");
            }

            Cart cart = cartCacheService.updateItemQuantity(userId, productId, quantity);
            System.out.println("Cart updated successfully");
            return ResponseEntity.ok(cart);
        } catch (Exception e) {
            System.out.println("Error updating cart: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error updating cart item: " + e.getMessage());
        }
    }

    @DeleteMapping("/remove/{productId}")
    public ResponseEntity<?> removeItemFromCart(@PathVariable String productId, Principal principal) {
        try {
            if (principal == null) {
                return ResponseEntity.status(401).body("User not authenticated");
            }

            UserProfileResponse userProfile = userService.findUserProfileByEmail(principal.getName());
            String userId = userProfile.getId();

            Cart cart = cartCacheService.removeItemFromCart(userId, productId);
            return ResponseEntity.ok(cart);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error removing item from cart: " + e.getMessage());
        }
    }

    @DeleteMapping("/clear")
    public ResponseEntity<?> clearCart(Principal principal) {
        try {
            if (principal == null) {
                return ResponseEntity.status(401).body("User not authenticated");
            }

            UserProfileResponse userProfile = userService.findUserProfileByEmail(principal.getName());
            String userId = userProfile.getId();

            cartCacheService.clearCart(userId);
            return ResponseEntity.ok("Cart cleared successfully");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error clearing cart: " + e.getMessage());
        }
    }

    @GetMapping("/count")
    public ResponseEntity<?> getCartItemCount(Principal principal) {
        try {
            if (principal == null) {
                return ResponseEntity.status(401).body("User not authenticated");
            }

            UserProfileResponse userProfile = userService.findUserProfileByEmail(principal.getName());
            String userId = userProfile.getId();

            int count = cartCacheService.getCartItemCount(userId);
            return ResponseEntity.ok(Map.of("count", count));
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error getting cart count: " + e.getMessage());
        }
    }
}

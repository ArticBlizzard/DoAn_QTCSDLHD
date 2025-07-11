package dev.anhhoang.QTCSDLHD.services;

import dev.anhhoang.QTCSDLHD.models.Cart;
import dev.anhhoang.QTCSDLHD.models.CartItem;
import dev.anhhoang.QTCSDLHD.models.Product;
import dev.anhhoang.QTCSDLHD.repositories.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.concurrent.TimeUnit;

@Service
public class CartCacheService {

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    @Autowired
    private ProductRepository productRepository;

    private static final String CART_KEY_PREFIX = "cart:";
    private static final long CART_EXPIRY_HOURS = 24;

    private String getCartKey(String userId) {
        return CART_KEY_PREFIX + userId;
    }

    // Loại bỏ @Cacheable để tránh conflict
    public Cart getCart(String userId) {
        String key = getCartKey(userId);
        Cart cart = (Cart) redisTemplate.opsForValue().get(key);
        
        if (cart == null) {
            cart = new Cart();
            cart.setUserId(userId);
            // Save new cart to Redis
            redisTemplate.opsForValue().set(key, cart, CART_EXPIRY_HOURS, TimeUnit.HOURS);
            System.out.println("🆕 REDIS CART CREATED: New cart created for user " + userId);
        } else {
            System.out.println("📖 REDIS CART RETRIEVED: Cart found for user " + userId + " with " + cart.getItems().size() + " items");
        }
        
        return cart;
    }

    // Loại bỏ @CachePut để tránh conflict, chỉ dùng RedisTemplate
    public Cart saveCart(Cart cart) {
        String key = getCartKey(cart.getUserId());
        redisTemplate.opsForValue().set(key, cart, CART_EXPIRY_HOURS, TimeUnit.HOURS);
        System.out.println("💾 REDIS CART SAVED: Cart for user " + cart.getUserId() + " saved to Redis with key: " + key);
        
        // Verify data was saved
        Cart verifyCart = (Cart) redisTemplate.opsForValue().get(key);
        if (verifyCart != null) {
            System.out.println("✅ REDIS VERIFICATION: Cart successfully saved with " + verifyCart.getItems().size() + " items");
        } else {
            System.out.println("❌ REDIS ERROR: Failed to save cart to Redis");
        }
        
        return cart;
    }

    // Loại bỏ @CacheEvict để tránh conflict
    public void clearCart(String userId) {
        String key = getCartKey(userId);
        Boolean deleted = redisTemplate.delete(key);
        System.out.println("🗑️ REDIS CART CLEARED: Cart for user " + userId + " cleared. Success: " + deleted);
    }

    public Cart addItemToCart(String userId, String productId, int quantity) {
        System.out.println("🔍 CART ADD START: User " + userId + " adding product " + productId + " quantity " + quantity);
        
        Cart cart = getCart(userId);
        System.out.println("📋 CURRENT CART: " + cart.getItems().size() + " items before adding");
        
        // Get product details
        Optional<Product> productOpt = productRepository.findById(productId);
        if (productOpt.isEmpty()) {
            throw new RuntimeException("Product not found");
        }
        
        Product product = productOpt.get();
        System.out.println("🛍️ PRODUCT FOUND: " + product.getName() + " - Price: " + product.getPrice());
        
        // Check if product already exists in cart
        CartItem existingItem = cart.getItems().stream()
                .filter(item -> item.getProductId().equals(productId))
                .findFirst()
                .orElse(null);
        
        if (existingItem != null) {
            // Update quantity
            int oldQuantity = existingItem.getQuantity();
            existingItem.setQuantity(oldQuantity + quantity);
            System.out.println("📦 REDIS CART UPDATE: User " + userId + " updated product " + product.getName() + " quantity from " + oldQuantity + " to " + existingItem.getQuantity());
        } else {
            // Add new item
            CartItem newItem = new CartItem();
            newItem.setProductId(productId);
            newItem.setProductName(product.getName());
            newItem.setPrice(product.getPrice());
            newItem.setQuantity(quantity);
            newItem.setImageUrl(product.getImage_url());
            newItem.setShopId(product.getShopid());
            newItem.setShopName(product.getShopname());
            cart.getItems().add(newItem);
            System.out.println("🛒 REDIS CART ADD: User " + userId + " added product " + product.getName() + " (quantity: " + quantity + ") to cart");
        }
        
        // Update cart total
        updateCartTotal(cart);
        System.out.println("💰 CART TOTAL UPDATED: New total = " + cart.getTotal());
        
        // Save to Redis and log
        Cart savedCart = saveCart(cart);
        System.out.println("✅ CART ADD COMPLETE: Cart for user " + userId + " now has " + cart.getItems().size() + " items, total: " + cart.getTotal());
        
        return savedCart;
    }

    public Cart removeItemFromCart(String userId, String productId) {
        Cart cart = getCart(userId);
        
        cart.getItems().removeIf(item -> item.getProductId().equals(productId));
        
        // Update cart total
        updateCartTotal(cart);
        
        return saveCart(cart);
    }

    public Cart updateItemQuantity(String userId, String productId, int quantity) {
        Cart cart = getCart(userId);
        
        CartItem item = cart.getItems().stream()
                .filter(cartItem -> cartItem.getProductId().equals(productId))
                .findFirst()
                .orElse(null);
        
        if (item == null) {
            // Item doesn't exist in cart, we need to add it first
            if (quantity > 0) {
                // Get product details to create cart item
                Product product = productRepository.findById(productId)
                        .orElseThrow(() -> new RuntimeException("Product not found"));
                
                CartItem newItem = new CartItem();
                newItem.setProductId(productId);
                newItem.setProductName(product.getName());
                newItem.setPrice(product.getPrice());
                newItem.setQuantity(quantity);
                newItem.setImageUrl(product.getImage_url());
                newItem.setShopId(product.getShopid());
                newItem.setShopName(product.getShopname());
                
                cart.getItems().add(newItem);
            }
            // If quantity <= 0 and item doesn't exist, do nothing
        } else {
            // Item exists, update or remove it
            if (quantity <= 0) {
                cart.getItems().remove(item);
            } else {
                item.setQuantity(quantity);
            }
        }
        
        // Update cart total
        updateCartTotal(cart);
        
        return saveCart(cart);
    }

    private void updateCartTotal(Cart cart) {
        double total = cart.getItems().stream()
                .mapToDouble(item -> item.getPrice() * item.getQuantity())
                .sum();
        cart.setTotal(total);
    }

    public int getCartItemCount(String userId) {
        Cart cart = getCart(userId);
        return cart.getItems().stream()
                .mapToInt(CartItem::getQuantity)
                .sum();
    }
}

package dev.anhhoang.QTCSDLHD.services;

import dev.anhhoang.QTCSDLHD.dto.*;
import dev.anhhoang.QTCSDLHD.models.*;
import dev.anhhoang.QTCSDLHD.repositories.CustomerRepository;
import dev.anhhoang.QTCSDLHD.repositories.OrderRepository;
import dev.anhhoang.QTCSDLHD.repositories.ProductRepository;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.redis.core.RedisTemplate;


import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class CustomerServiceImpl implements CustomerService {

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    private String getCartKey(String customerId) {
    return "cart:" + customerId;
    }

    @Override
    public UserProfileResponse addProductToCart(String customerId, AddToCartRequest request) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new RuntimeException("Product not found"));

        Optional<CartItem> existingCartItem = customer.getCart().stream()
                .filter(item -> item.getProduct_id().equals(request.getProductId()))
                .findFirst();

        if (existingCartItem.isPresent()) {
            existingCartItem.get().setQuantity(existingCartItem.get().getQuantity() + request.getQuantity());
        } else {
            CartItem newCartItem = new CartItem();
            newCartItem.setProduct_id(product.get_id());
            newCartItem.setQuantity(request.getQuantity());
            customer.getCart().add(newCartItem);
        }
        customer.setUpdated_at(LocalDateTime.now());
        customerRepository.save(customer);

        // Cập nhật Redis
        redisTemplate.opsForValue().set(getCartKey(customerId), customer.getCart());

        return convertToUserProfileResponse(customer);
    }

    @Override
    public UserProfileResponse removeProductFromCart(String customerId, RemoveFromCartRequest request) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        boolean removed = customer.getCart().removeIf(item -> item.getProduct_id().equals(request.getProductId()));

        if (!removed) {
            throw new RuntimeException("Product not found in cart");
        }
        customer.setUpdated_at(LocalDateTime.now());
        customerRepository.save(customer);

        // Cập nhật cache
        redisTemplate.opsForValue().set(getCartKey(customerId), customer.getCart());

        return convertToUserProfileResponse(customer);
    }

    @Override
    public UserProfileResponse updateCartItemQuantity(String customerId, String productId, Integer quantity) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        CartItem cartItem = customer.getCart().stream()
                .filter(item -> item.getProduct_id().equals(productId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Product not found in cart"));

        if (quantity <= 0) {
            customer.getCart().remove(cartItem);
        } else {
            cartItem.setQuantity(quantity);
        }
        customer.setUpdated_at(LocalDateTime.now());
        customerRepository.save(customer);

        // Cập nhật cache
        redisTemplate.opsForValue().set(getCartKey(customerId), customer.getCart());

        return convertToUserProfileResponse(customer);
    }

   @Override
    public List<ProductResponse> getCartProducts(String customerId) {
        List<CartItem> cart;

        // ⚡ Lấy từ Redis
        Object cached = redisTemplate.opsForValue().get(getCartKey(customerId));
        if (cached != null) {
            cart = (List<CartItem>) cached;
        } else {
            // 🐢 Lấy từ MongoDB nếu Redis không có
            Customer customer = customerRepository.findById(customerId)
                    .orElseThrow(() -> new RuntimeException("Customer not found"));
            cart = customer.getCart();
            // Cache lại
            redisTemplate.opsForValue().set(getCartKey(customerId), cart);
        }

        return cart.stream()
                .map(cartItem -> productRepository.findById(cartItem.getProduct_id())
                        .map(product -> {
                            ProductResponse productResponse = new ProductResponse();
                            BeanUtils.copyProperties(product, productResponse);
                            productResponse.setQuantity(cartItem.getQuantity());
                            return productResponse;
                        })
                        .orElse(null))
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toList());
    }


    @Override
    @Transactional
    public String createOrderFromCart(String customerId, CreateOrderRequest request) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        if (customer.getCart().isEmpty()) {
            throw new RuntimeException("Cart is empty. Cannot create order.");
        }

        Order order = new Order();
        order.setCustomer_id(customerId);
        order.setShipping_address(request.getShippingAddress());
        order.setPayment_method(request.getPaymentMethod());
        order.setStatus("Pending"); // Initial status
        order.setCreated_at(LocalDateTime.now());
        order.setUpdated_at(LocalDateTime.now());

        List<OrderItem> orderItems = new ArrayList<>();
        double total = 0.0;

        for (CartItemRequest cartItemRequest : request.getItems()) {
            Product product = productRepository.findById(cartItemRequest.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product not found: " + cartItemRequest.getProductId()));

            if (product.getStock() < cartItemRequest.getQuantity()) {
                throw new RuntimeException("Not enough stock for product: " + product.getName());
            }

            OrderItem orderItem = new OrderItem();
            orderItem.setProduct_id(product.get_id());
            orderItem.setQuantity(cartItemRequest.getQuantity());
            orderItem.setPrice(product.getPrice());
            orderItems.add(orderItem);

            total += product.getPrice() * cartItemRequest.getQuantity();

            // Deduct stock
            product.setStock(product.getStock() - cartItemRequest.getQuantity());
            productRepository.save(product);
        }

        order.setItems(orderItems);
        order.setTotal(total);

        Order savedOrder = orderRepository.save(order);

        // Clear the cart after order creation
        customer.getCart().clear();
        customer.getOrders().add(savedOrder.get_id());
        customer.setUpdated_at(LocalDateTime.now());
        customerRepository.save(customer);

        // Xoá cache giỏ hàng trên Redis
        redisTemplate.delete(getCartKey(customerId));

        return savedOrder.get_id();
    }


    // Assuming UserProfileResponse is an existing DTO for user information
    private UserProfileResponse convertToUserProfileResponse(Customer customer) {
        UserProfileResponse response = new UserProfileResponse();
        // Copy relevant properties from customer to UserProfileResponse
        BeanUtils.copyProperties(customer, response);
        return response;
    }
}
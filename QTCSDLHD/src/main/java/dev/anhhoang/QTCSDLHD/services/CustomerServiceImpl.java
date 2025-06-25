package dev.anhhoang.QTCSDLHD.services;

import dev.anhhoang.QTCSDLHD.dto.*;
import dev.anhhoang.QTCSDLHD.models.*;
import dev.anhhoang.QTCSDLHD.repositories.CustomerRepository;
import dev.anhhoang.QTCSDLHD.repositories.OrderRepository;
import dev.anhhoang.QTCSDLHD.repositories.ProductRepository;
import dev.anhhoang.QTCSDLHD.repositories.UserRepository;
import dev.anhhoang.QTCSDLHD.neo4j.services.RecommendationService;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.util.StringUtils;


import java.math.BigDecimal;
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

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private VoucherService voucherService;

    @Autowired
    private RecommendationService recommendationService;

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
                            // Explicitly set shop_name, with fallback to SellerProfile if product.shopname
                            // is null
                            if (product.getShopname() != null && !product.getShopname().isEmpty()) {
                                productResponse.setShop_name(product.getShopname());
                            } else if (product.getShopid() != null) {
                                // Fetch the seller's user profile to get the shop name
                                userRepository.findBySellerProfileShopId(product.getShopid()).ifPresent(sellerUser -> {
                                    if (sellerUser.getSellerProfile() != null
                                            && sellerUser.getSellerProfile().getShopName() != null) {
                                        productResponse.setShop_name(sellerUser.getSellerProfile().getShopName());
                                    }
                                });
                            }
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

        // Get shipping address from request or user profile
        String shippingAddress;
        if (!StringUtils.hasText(request.getShippingAddress())) {
            // If no address provided, get from user profile
            User user = userRepository.findById(customerId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            if (user.getBuyerProfile() == null || user.getBuyerProfile().getPrimaryAddress() == null) {
                throw new RuntimeException("No shipping address found in profile. Please provide a shipping address.");
            }

            Address primaryAddress = user.getBuyerProfile().getPrimaryAddress();
            shippingAddress = String.format("%s, %s, %s, %s",
                    primaryAddress.getStreet(),
                    primaryAddress.getWard(),
                    primaryAddress.getDistrict(),
                    primaryAddress.getCity());
        } else {
            shippingAddress = request.getShippingAddress();
        }

        // Validate bank account for bank payment
        if ("Thẻ ngân hàng".equals(request.getPaymentMethod())) {
            if (request.getBankAccount() == null) {
                throw new RuntimeException("Bank account information is required for bank payment.");
            }
        }

        Order order = new Order();
        order.setCustomer_id(customerId);
        order.setFullName(request.getFullName());
        order.setPhoneNumber(request.getPhoneNumber());
        order.setShipping_address(shippingAddress);
        order.setPayment_method(request.getPaymentMethod());
        order.setBankAccount(request.getBankAccount());
        order.setStatus("Pending");
        order.setCreated_at(LocalDateTime.now());
        order.setUpdated_at(LocalDateTime.now());

        List<OrderItem> orderItems = new ArrayList<>();
        BigDecimal total = BigDecimal.ZERO;

        for (CartItemRequest cartItemRequest : request.getItems()) {
            Product product = productRepository.findById(cartItemRequest.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product not found: " + cartItemRequest.getProductId()));

            if (product.getStock() < cartItemRequest.getQuantity()) {
                throw new RuntimeException("Not enough stock for product: " + product.getName());
            }

            OrderItem orderItem = new OrderItem();
            orderItem.setProduct_id(product.get_id());
            orderItem.setQuantity(cartItemRequest.getQuantity());

            BigDecimal itemPrice = new BigDecimal(product.getPrice());
            String voucherId = cartItemRequest.getVoucherId();

            if (voucherId != null && !voucherId.isEmpty()) {
                Voucher voucher = voucherService.getVoucherById(voucherId);
                if (voucher != null && voucherService.isVoucherValid(voucher,
                        itemPrice.multiply(BigDecimal.valueOf(cartItemRequest.getQuantity())))) {
                    BigDecimal discount = voucherService.calculateDiscount(voucher,
                            itemPrice.multiply(BigDecimal.valueOf(cartItemRequest.getQuantity())));
                    itemPrice = itemPrice.multiply(BigDecimal.valueOf(cartItemRequest.getQuantity())).subtract(discount)
                            .divide(BigDecimal.valueOf(cartItemRequest.getQuantity()), 2,
                                    java.math.RoundingMode.HALF_UP); // Calculate discounted unit price
                    orderItem.setVoucherId(voucherId);
                }
            }

            orderItem.setPrice(itemPrice.doubleValue());
            orderItems.add(orderItem);

            total = total.add(itemPrice.multiply(BigDecimal.valueOf(cartItemRequest.getQuantity())));

            // Deduct stock
            product.setStock(product.getStock() - cartItemRequest.getQuantity());
            productRepository.save(product);
        }

        order.setItems(orderItems);

        if ("Thẻ ngân hàng".equals(request.getPaymentMethod())) {
            order.setTotal(0.0);
        } else {
            order.setTotal(total.doubleValue());
        }

        Order savedOrder = orderRepository.save(order);

        // Tracking hành vi mua sản phẩm vào Neo4j
        for (OrderItem item : orderItems) {
            recommendationService.recordProductPurchase(customerId, item.getProduct_id(), item.getQuantity());
        }

        // Remove only ordered items from cart after order creation
        List<String> orderedProductIds = request.getItems().stream()
                .map(CartItemRequest::getProductId)
                .collect(Collectors.toList());
        customer.getCart().removeIf(item -> orderedProductIds.contains(item.getProduct_id()));
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
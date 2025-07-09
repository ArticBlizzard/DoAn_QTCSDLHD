package dev.anhhoang.QTCSDLHD.services;

import dev.anhhoang.QTCSDLHD.dto.*;
import dev.anhhoang.QTCSDLHD.models.*;
import dev.anhhoang.QTCSDLHD.repositories.OrderRepository;
import dev.anhhoang.QTCSDLHD.repositories.ProductRepository;
import dev.anhhoang.QTCSDLHD.repositories.UserRepository;
import dev.anhhoang.QTCSDLHD.repositories.CartRepository;
import dev.anhhoang.QTCSDLHD.neo4j.services.RecommendationService;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
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
    private UserRepository userRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private VoucherService voucherService;

    @Autowired
    private RecommendationService recommendationService;

    @Override
    public UserProfileResponse addProductToCart(String customerId, AddToCartRequest request) {
        User user = userRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new RuntimeException("Product not found"));

        Cart cart = cartRepository.findByCustomerId(customerId)
                .orElseGet(() -> {
                    Cart newCart = new Cart();
                    newCart.setCustomerId(customerId);
                    newCart.setStatus("active");
                    newCart.setCreated_at(LocalDateTime.now());
                    newCart.setUpdated_at(LocalDateTime.now());
                    newCart.setItems(new ArrayList<>());
                    return cartRepository.save(newCart);
                });

        Optional<CartItem> existingCartItem = cart.getItems().stream()
                .filter(item -> item.getProduct_id().equals(request.getProductId()))
                .findFirst();

        if (existingCartItem.isPresent()) {
            existingCartItem.get().setQuantity(existingCartItem.get().getQuantity() + request.getQuantity());
        } else {
            CartItem newCartItem = new CartItem();
            newCartItem.setProduct_id(product.get_id());
            newCartItem.setQuantity(request.getQuantity());
            cart.getItems().add(newCartItem);
        }
        cart.setStatus("active");
        cart.setUpdated_at(LocalDateTime.now());
        cartRepository.save(cart);
        return convertToUserProfileResponse(user);
    }

    @Override
    public UserProfileResponse removeProductFromCart(String customerId, RemoveFromCartRequest request) {
        User user = userRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));
        Cart cart = cartRepository.findByCustomerId(customerId)
                .orElseThrow(() -> new RuntimeException("No cart found"));
        boolean removed = cart.getItems().removeIf(item -> item.getProduct_id().equals(request.getProductId()));
        if (!removed) {
            throw new RuntimeException("Product not found in cart");
        }
        cart.setStatus("active");
        cart.setUpdated_at(LocalDateTime.now());
        cartRepository.save(cart);
        return convertToUserProfileResponse(user);
    }

    @Override
    public UserProfileResponse updateCartItemQuantity(String customerId, String productId, Integer quantity) {
        User user = userRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));
        Cart cart = cartRepository.findByCustomerId(customerId)
                .orElseThrow(() -> new RuntimeException("No cart found"));
        CartItem cartItem = cart.getItems().stream()
                .filter(item -> item.getProduct_id().equals(productId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Product not found in cart"));
        if (quantity <= 0) {
            cart.getItems().remove(cartItem);
        } else {
            cartItem.setQuantity(quantity);
        }
        cart.setStatus("active");
        cart.setUpdated_at(LocalDateTime.now());
        cartRepository.save(cart);
        return convertToUserProfileResponse(user);
    }

    @Override
    public List<ProductResponse> getCartProducts(String customerId) {
        User user = userRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));
        Cart cart = cartRepository.findByCustomerId(customerId)
                .orElse(null);
        if (cart == null || cart.getItems().isEmpty())
            return new ArrayList<>();
        return cart.getItems().stream()
                .map(cartItem -> productRepository.findById(cartItem.getProduct_id())
                        .map(product -> {
                            ProductResponse productResponse = new ProductResponse();
                            BeanUtils.copyProperties(product, productResponse);
                            productResponse.setQuantity(cartItem.getQuantity());
                            if (product.getShopname() != null && !product.getShopname().isEmpty()) {
                                productResponse.setShop_name(product.getShopname());
                            } else if (product.getShopid() != null) {
                                userRepository.findBySellerProfileShopId(product.getShopid()).ifPresent(sellerUser -> {
                                    if (sellerUser.getSellerProfile() != null
                                            && sellerUser.getSellerProfile().getShopName() != null) {
                                        productResponse.setShop_name(sellerUser.getSellerProfile().getShopName());
                                    }
                                });
                            }
                            return productResponse;
                        })
                        .orElseGet(() -> {
                            // If product not found in ProductRepository, return a ProductResponse with
                            // stock 0
                            // This allows the frontend to display it as out of stock/unavailable
                            ProductResponse productResponse = new ProductResponse();
                            productResponse.set_id(cartItem.getProduct_id());
                            productResponse.setName("Sản phẩm không còn tồn tại");
                            productResponse.setStock(0); // Mark as out of stock
                            productResponse.setQuantity(cartItem.getQuantity());
                            productResponse.setPrice(0.0); // Set price to 0
                            productResponse.setImage_url("/soldout.png"); // Use soldout image
                            return productResponse;
                        }))
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public String createOrderFromCart(String customerId, CreateOrderRequest request) {
        User user = userRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        if (request.getItems().isEmpty()) {
            throw new RuntimeException("Order items list is empty. Cannot create order.");
        }

        // Get shipping address from request or user profile
        String shippingAddress;
        if (!StringUtils.hasText(request.getShippingAddress())) {
            // If no address provided, get from user profile
            if (user.getBuyerProfile() == null ||
                    user.getBuyerProfile().getPrimaryAddress() == null) {
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

        // Remove only ordered items from cart after order creation if it's not a 'Buy
        // Now' purchase
        if (!request.isBuyNow()) {
            Cart cart = cartRepository.findByCustomerId(customerId)
                    .orElseThrow(() -> new RuntimeException("No cart found"));
            List<String> orderedProductIds = request.getItems().stream()
                    .map(CartItemRequest::getProductId)
                    .collect(Collectors.toList());
            cart.getItems().removeIf(item -> orderedProductIds.contains(item.getProduct_id()));

            // Update and save the cart status and items after removal
            cart.setStatus("active"); // Keep cart active for remaining items
            cart.setUpdated_at(LocalDateTime.now());
            cartRepository.save(cart); // Ensure the cart is saved after modifications
        }

        return savedOrder.get_id();
    }

    // Assuming UserProfileResponse is an existing DTO for user information
    private UserProfileResponse convertToUserProfileResponse(User user) {
        UserProfileResponse response = new UserProfileResponse();
        // Copy relevant properties from user to UserProfileResponse
        BeanUtils.copyProperties(user, response);
        return response;
    }
}
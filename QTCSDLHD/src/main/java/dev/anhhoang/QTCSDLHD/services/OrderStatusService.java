package dev.anhhoang.QTCSDLHD.services;

import dev.anhhoang.QTCSDLHD.dto.OrderStatusResponse;
import dev.anhhoang.QTCSDLHD.models.Order;
import dev.anhhoang.QTCSDLHD.models.OrderItem;
import dev.anhhoang.QTCSDLHD.models.Product;
import dev.anhhoang.QTCSDLHD.repositories.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class OrderStatusService {

    @Autowired
    private ProductRepository productRepository;

    public OrderStatusResponse convertToOrderStatusResponse(Order order) {
        OrderStatusResponse response = new OrderStatusResponse();
        response.setOrderId(order.get_id());
        response.setStatus(convertBackendStatusToFrontend(order.getStatus()));
        response.setFullName(order.getFullName());
        response.setPhoneNumber(order.getPhoneNumber());
        response.setShipping_address(order.getShipping_address());
        response.setPayment_method(order.getPayment_method());
        response.setTotal(order.getTotal());
        response.setCreated_at(order.getCreated_at());
        response.setUpdated_at(order.getUpdated_at());

        // Get product details for items
        List<String> productIds = order.getItems().stream()
                .map(OrderItem::getProduct_id)
                .collect(Collectors.toList());

        Map<String, Product> productMap = productRepository.findAllById(productIds)
                .stream()
                .collect(Collectors.toMap(Product::get_id, p -> p));

        List<OrderStatusResponse.OrderItemResponse> itemResponses = order.getItems().stream()
                .map(item -> {
                    OrderStatusResponse.OrderItemResponse itemResponse = new OrderStatusResponse.OrderItemResponse();
                    Product product = productMap.get(item.getProduct_id());
                    
                    itemResponse.setProductId(item.getProduct_id());
                    itemResponse.setPrice(item.getPrice());
                    itemResponse.setQuantity(item.getQuantity());
                    itemResponse.setSubtotal(item.getPrice() * item.getQuantity());
                    
                    if (product != null) {
                        itemResponse.setProductName(product.getName());
                        itemResponse.setProductImage(product.getImage_url());
                        itemResponse.setShopName(product.getShopname());
                    } else {
                        itemResponse.setProductName("Product not found");
                        itemResponse.setProductImage("");
                        itemResponse.setShopName("");
                    }
                    
                    return itemResponse;
                })
                .collect(Collectors.toList());

        response.setItems(itemResponses);
        return response;
    }
    
    private String convertBackendStatusToFrontend(String backendStatus) {
        switch (backendStatus.toUpperCase()) {
            case "PENDING":
                return "pending";
            case "CONFIRMED":
                return "confirmed";
            case "SHIPPING":
                return "shipped";
            case "DELIVERED":
                return "delivered";
            case "CANCELLED":
                return "cancelled";
            default:
                return backendStatus.toLowerCase();
        }
    }

    public List<OrderStatusResponse> convertToOrderStatusResponseList(List<Order> orders) {
        return orders.stream()
                .map(this::convertToOrderStatusResponse)
                .collect(Collectors.toList());
    }
}

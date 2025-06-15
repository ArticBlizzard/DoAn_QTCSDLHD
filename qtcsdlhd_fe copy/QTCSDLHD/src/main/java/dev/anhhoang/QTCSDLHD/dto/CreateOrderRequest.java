package dev.anhhoang.QTCSDLHD.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class CreateOrderRequest {
    @NotBlank(message = "Shipping address is required")
    private String shippingAddress;
    @NotBlank(message = "Payment method is required")
    private String paymentMethod;
    @NotNull(message = "Cart items cannot be null")
    private List<CartItemRequest> items;
}
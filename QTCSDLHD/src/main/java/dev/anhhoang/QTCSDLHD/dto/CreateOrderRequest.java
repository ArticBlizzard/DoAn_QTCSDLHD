package dev.anhhoang.QTCSDLHD.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import dev.anhhoang.QTCSDLHD.models.BankAccount;

import java.util.List;

@Data
public class CreateOrderRequest {
    @NotBlank(message = "Full name is required")
    private String fullName;

    @NotBlank(message = "Phone number is required")
    private String phoneNumber;

    @NotBlank(message = "Shipping address is required")
    private String shippingAddress;

    @NotBlank(message = "Payment method is required")
    private String paymentMethod;

    private BankAccount bankAccount; // Optional, only required for bank payment

    @NotNull(message = "Cart items cannot be null")
    private List<CartItemRequest> items;
}
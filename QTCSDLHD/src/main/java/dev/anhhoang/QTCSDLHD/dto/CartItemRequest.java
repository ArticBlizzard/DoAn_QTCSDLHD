package dev.anhhoang.QTCSDLHD.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CartItemRequest {
    @NotBlank(message = "Product ID is required")
    private String productId;
    @Min(value = 1, message = "Quantity must be at least 1")
    @NotNull(message = "Quantity is required")
    private Integer quantity;
    private String voucherId;
}
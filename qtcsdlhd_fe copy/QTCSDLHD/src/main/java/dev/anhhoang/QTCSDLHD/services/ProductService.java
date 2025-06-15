package dev.anhhoang.QTCSDLHD.services;

import dev.anhhoang.QTCSDLHD.dto.ProductResponse;

import java.util.List;

public interface ProductService {
    List<ProductResponse> getAllProducts();

    ProductResponse getProductById(String id);

    List<ProductResponse> searchProducts(String keyword);
}
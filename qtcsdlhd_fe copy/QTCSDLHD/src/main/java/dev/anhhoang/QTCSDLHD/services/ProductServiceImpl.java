package dev.anhhoang.QTCSDLHD.services;

import dev.anhhoang.QTCSDLHD.dto.ProductResponse;
import dev.anhhoang.QTCSDLHD.models.Product;
import dev.anhhoang.QTCSDLHD.repositories.ProductRepository;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ProductServiceImpl implements ProductService {

    @Autowired
    private ProductRepository productRepository;

    @Override
    public List<ProductResponse> getAllProducts() {
        return productRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public ProductResponse getProductById(String id) {
        Optional<Product> product = productRepository.findById(id);
        return product.map(this::convertToDto).orElseThrow(() -> new RuntimeException("Product not found"));
    }

    @Override
    public List<ProductResponse> searchProducts(String keyword) {
        // This will require a custom query in the repository. For now, a basic search
        // by name.
        // In a real application, consider using text indexes for better search
        // performance.
        return productRepository.findByNameContainingIgnoreCase(keyword).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    private ProductResponse convertToDto(Product product) {
        ProductResponse productResponse = new ProductResponse();
        BeanUtils.copyProperties(product, productResponse);
        return productResponse;
    }
}
package dev.anhhoang.QTCSDLHD.services;

import dev.anhhoang.QTCSDLHD.dto.ProductResponse;
import dev.anhhoang.QTCSDLHD.models.Product;
import dev.anhhoang.QTCSDLHD.repositories.ProductRepository;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ProductServiceImpl implements ProductService {

    @Autowired
    private ProductRepository productRepository;

    @Override
    public List<ProductResponse> getAllProducts(String sort) {
        Sort sortOrder = createSortOrder(sort);
        return productRepository.findAll(sortOrder).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public ProductResponse getProductById(String id) {
        Optional<Product> product = productRepository.findById(id);
        return product.map(this::convertToDto).orElseThrow(() -> new RuntimeException("Product not found"));
    }

    @Override
    public List<ProductResponse> searchProducts(String keyword, String category, String sort) {
        Sort sortOrder = createSortOrder(sort);
        List<Product> products;

        if (keyword != null && !keyword.isEmpty() && category != null && !category.isEmpty()) {
            products = productRepository.findByNameContainingIgnoreCaseAndCategory(keyword, category, sortOrder);
        } else if (keyword != null && !keyword.isEmpty()) {
            products = productRepository.findByNameContainingIgnoreCase(keyword, sortOrder);
        } else if (category != null && !category.isEmpty()) {
            products = productRepository.findByCategory(category, sortOrder);
        } else {
            products = productRepository.findAll(sortOrder);
        }

        return products.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<String> getAllCategories() {
        return productRepository.findAll().stream()
                .map(Product::getCategory)
                .distinct()
                .filter(java.util.Objects::nonNull) // Filter out null categories
                .collect(Collectors.toList());
    }

    private ProductResponse convertToDto(Product product) {
        ProductResponse productResponse = new ProductResponse();
        BeanUtils.copyProperties(product, productResponse);
        productResponse.setShop_name(product.getShopname());
        return productResponse;
    }

    private Sort createSortOrder(String sort) {
        if (sort == null || sort.isEmpty()) {
            return Sort.unsorted();
        }
        switch (sort) {
            case "priceAsc":
                return Sort.by(Sort.Direction.ASC, "price");
            case "priceDesc":
                return Sort.by(Sort.Direction.DESC, "price");
            default:
                return Sort.unsorted();
        }
    }
}
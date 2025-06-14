package dev.anhhoang.QTCSDLHD.controllers;

import java.security.Principal;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import dev.anhhoang.QTCSDLHD.models.Product;
import dev.anhhoang.QTCSDLHD.models.Role;
import dev.anhhoang.QTCSDLHD.models.User;
import dev.anhhoang.QTCSDLHD.repositories.ProductRepository;
import dev.anhhoang.QTCSDLHD.repositories.UserRepository;

@RestController
@RequestMapping("/api/products")
public class ProductController {
    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/create")
    public ResponseEntity<?> createProduct(@RequestBody Product product, Principal principal) {
        // principal.getName() là email của user đã đăng nhập
        Optional<User> userOpt = userRepository.findByEmail(principal.getName());
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(401).body("User not found");
        }
        User user = userOpt.get();
        // Kiểm tra user có role là buyer không
        boolean isBuyer = user.getRoles().contains(Role.ROLE_BUYER);
        if (!isBuyer) {
            return ResponseEntity.status(403).body("Only buyers can create products");
        }
        product.setSellerId(user.getId());
        product.setSellerName(user.getFullName());
        Product saved = productRepository.save(product);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/mine")
    public ResponseEntity<?> getAllProducts(Principal principal) {
        Optional<User> userOpt = userRepository.findByEmail(principal.getName());
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(401).body("User not found");
        }
        User user = userOpt.get();
        // Chỉ cho phép seller xem sản phẩm của mình
        boolean isSeller = user.getRoles().contains(Role.ROLE_SELLER);
        if (!isSeller) {
            return ResponseEntity.status(403).body("Only sellers can view their products");
        }
        List<Product> products = productRepository.findBySellerId(user.getId());
        return ResponseEntity.ok(products);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateProduct(@PathVariable String id, @RequestBody Product updatedProduct, Principal principal) {
        Optional<User> userOpt = userRepository.findByEmail(principal.getName());
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(401).body("User not found");
        }
        User user = userOpt.get();
        boolean isSeller = user.getRoles().contains(Role.ROLE_SELLER);
        if (!isSeller) {
            return ResponseEntity.status(403).body("Only sellers can update products");
        }
        Optional<Product> productOpt = productRepository.findById(id);
        if (productOpt.isEmpty()) {
            return ResponseEntity.status(404).body("Product not found");
        }
        Product product = productOpt.get();
        if (!user.getId().equals(product.getSellerId())) {
            return ResponseEntity.status(403).body("You can only update your own products");
        }
        // Cập nhật các trường
        product.setName(updatedProduct.getName());
        product.setDescription(updatedProduct.getDescription());
        product.setPrice(updatedProduct.getPrice());
        product.setImageUrl(updatedProduct.getImageUrl());
        product.setCategory(updatedProduct.getCategory());
        product.setStock(updatedProduct.getStock());
        Product saved = productRepository.save(product);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProduct(@PathVariable String id, Principal principal) {
        Optional<User> userOpt = userRepository.findByEmail(principal.getName());
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(401).body("User not found");
        }
        User user = userOpt.get();
        boolean isSeller = user.getRoles().contains(Role.ROLE_SELLER);
        if (!isSeller) {
            return ResponseEntity.status(403).body("Only sellers can delete products");
        }
        Optional<Product> productOpt = productRepository.findById(id);
        if (productOpt.isEmpty()) {
            return ResponseEntity.status(404).body("Product not found");
        }
        Product product = productOpt.get();
        if (!user.getId().equals(product.getSellerId())) {
            return ResponseEntity.status(403).body("You can only delete your own products");
        }
        productRepository.deleteById(id);
        return ResponseEntity.ok("Product deleted successfully");
    }
}

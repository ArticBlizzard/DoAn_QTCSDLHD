package dev.anhhoang.QTCSDLHD.controllers;

import java.security.Principal;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
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
}

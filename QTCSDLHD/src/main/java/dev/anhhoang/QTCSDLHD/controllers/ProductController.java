package dev.anhhoang.QTCSDLHD.controllers;

import dev.anhhoang.QTCSDLHD.dto.ProductResponse;
import dev.anhhoang.QTCSDLHD.services.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    @Autowired
    private ProductService productService;

    @GetMapping("/all")
    public ResponseEntity<List<ProductResponse>> getAllProducts(@RequestParam(required = false) String sort) {
        try {
            List<ProductResponse> products = productService.getAllProducts(sort);
            return ResponseEntity.ok(products);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null); // Or a more specific error response
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductResponse> getProductById(@PathVariable String id) {
        try {
            ProductResponse product = productService.getProductById(id);
            return ResponseEntity.ok(product);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null); // Or a more specific error response
        }
    }

    @GetMapping("/search")
    public ResponseEntity<List<ProductResponse>> searchProducts(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String sort) {
        try {
            List<ProductResponse> products = productService.searchProducts(keyword, category, sort);
            return ResponseEntity.ok(products);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null); // Or a more specific error response
        }
    }

    @GetMapping("/categories")
    public ResponseEntity<List<String>> getCategories() {
        try {
            List<String> categories = productService.getAllCategories();
            return ResponseEntity.ok(categories);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }
}
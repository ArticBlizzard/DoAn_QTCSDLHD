package dev.anhhoang.QTCSDLHD.repositories;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import dev.anhhoang.QTCSDLHD.models.Product;

public interface ProductRepository extends MongoRepository<Product, String> {
    List<Product> findBySellerId(String sellerId);
}

package dev.anhhoang.QTCSDLHD.repositories;

import dev.anhhoang.QTCSDLHD.models.Order;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OrderRepository extends MongoRepository<Order, String> {
}
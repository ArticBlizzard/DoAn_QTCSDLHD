package dev.anhhoang.QTCSDLHD.repositories;

import dev.anhhoang.QTCSDLHD.models.Order;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderRepository extends MongoRepository<Order, String> {
    @Query("{'customer_id': ?0}")
    List<Order> findByCustomer_id(String customerId);
    
    @Query("{'customer_id': ?0, 'status': ?1}")
    List<Order> findByCustomer_idAndStatus(String customerId, String status);
    
    @Query(value = "{'customer_id': ?0}", sort = "{'created_at': -1}")
    List<Order> findByCustomer_idOrderByCreated_atDesc(String customerId);
}
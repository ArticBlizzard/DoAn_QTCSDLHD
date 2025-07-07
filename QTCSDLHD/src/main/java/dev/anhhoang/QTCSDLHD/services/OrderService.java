package dev.anhhoang.QTCSDLHD.services;

import java.util.List;
import java.util.Map;

import dev.anhhoang.QTCSDLHD.models.Order;

public interface OrderService {
    List<Order> getOrdersBySeller(String sellerId, String status, String startDate, String endDate);
    Order getOrderDetailForSeller(String orderId, String sellerId);
    Order updateOrderStatusForSeller(String orderId, String sellerId, String newStatus);
    Map<String, Object> getOrderStatisticsBySeller(String sellerId);
    List<Map<String, Object>> getOrderChartDataBySeller(String sellerId, String period);
}

import React, { useState, useEffect, useCallback } from 'react';
import apiClient from './api/AxiosConfig';
import './OrderStatus.css';

const OrderStatus = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('all');

    const fetchOrders = useCallback(async () => {
        try {
            setLoading(true);
            let url = '/api/buyer/orders';
            
            if (selectedStatus !== 'all') {
                url += `/status/${selectedStatus}`;
            }
            
            const response = await apiClient.get(url);
            setOrders(response.data);
            setError('');
        } catch (err) {
            setError('Không thể tải danh sách đơn hàng');
            console.error('Error fetching orders:', err);
        } finally {
            setLoading(false);
        }
    }, [selectedStatus]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const handleCancelOrder = async (orderId) => {
        if (!window.confirm('Bạn có chắc chắn muốn hủy đơn hàng này?')) {
            return;
        }

        try {
            await apiClient.put(`/api/buyer/orders/${orderId}/cancel`);
            fetchOrders(); // Refresh the orders list
            alert('Đơn hàng đã được hủy thành công');
        } catch (err) {
            alert('Không thể hủy đơn hàng: ' + (err.response?.data || err.message));
        }
    };

    const getStatusColor = (status) => {
        const normalizedStatus = status.toLowerCase();
        switch (normalizedStatus) {
            case 'pending':
                return '#ffc107'; // yellow
            case 'confirmed':
                return '#17a2b8'; // info blue
            case 'processing':
                return '#fd7e14'; // orange
            case 'shipped':
            case 'shipping':
                return '#6f42c1'; // purple
            case 'delivered':
                return '#28a745'; // green
            case 'cancelled':
                return '#dc3545'; // red
            default:
                return '#6c757d'; // gray
        }
    };

    const getStatusText = (status) => {
        const normalizedStatus = status.toLowerCase();
        switch (normalizedStatus) {
            case 'pending':
                return 'Chờ xác nhận';
            case 'confirmed':
                return 'Đã xác nhận';
            case 'processing':
                return 'Đang xử lý';
            case 'shipped':
            case 'shipping':
                return 'Đang giao';
            case 'delivered':
                return 'Đã giao';
            case 'cancelled':
                return 'Đã hủy';
            default:
                return status;
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return <div className="loading">Đang tải...</div>;
    }

    return (
        <div className="order-status-container">
            <h2>Đơn hàng của tôi</h2>
            
            {/* Status Filter */}
            <div className="status-filter">
                <button 
                    className={selectedStatus === 'all' ? 'active' : ''}
                    onClick={() => setSelectedStatus('all')}
                >
                    Tất cả
                </button>
                <button 
                    className={selectedStatus === 'pending' ? 'active' : ''}
                    onClick={() => setSelectedStatus('pending')}
                >
                    Chờ xác nhận
                </button>
                <button 
                    className={selectedStatus === 'confirmed' ? 'active' : ''}
                    onClick={() => setSelectedStatus('confirmed')}
                >
                    Đã xác nhận
                </button>
                <button 
                    className={selectedStatus === 'processing' ? 'active' : ''}
                    onClick={() => setSelectedStatus('processing')}
                >
                    Đang xử lý
                </button>
                <button 
                    className={selectedStatus === 'shipped' ? 'active' : ''}
                    onClick={() => setSelectedStatus('shipped')}
                >
                    Đang giao
                </button>
                <button 
                    className={selectedStatus === 'delivered' ? 'active' : ''}
                    onClick={() => setSelectedStatus('delivered')}
                >
                    Đã giao
                </button>
                <button 
                    className={selectedStatus === 'cancelled' ? 'active' : ''}
                    onClick={() => setSelectedStatus('cancelled')}
                >
                    Đã hủy
                </button>
            </div>

            {error && <div className="error-message">{error}</div>}

            {orders.length === 0 ? (
                <div className="no-orders">
                    <p>Không có đơn hàng nào</p>
                </div>
            ) : (
                <div className="orders-list">
                    {orders.map(order => (
                        <div key={order.orderId} className="order-card">
                            <div className="order-header">
                                <div className="order-info">
                                    <h3>Đơn hàng #{order.orderId}</h3>
                                    <p>Ngày đặt: {formatDate(order.created_at)}</p>
                                </div>
                                <div className="order-status">
                                    <span 
                                        className="status-badge"
                                        style={{ backgroundColor: getStatusColor(order.status) }}
                                    >
                                        {getStatusText(order.status)}
                                    </span>
                                </div>
                            </div>

                            <div className="order-details">
                                <div className="shipping-info">
                                    <p><strong>Người nhận:</strong> {order.fullName}</p>
                                    <p><strong>SĐT:</strong> {order.phoneNumber}</p>
                                    <p><strong>Địa chỉ:</strong> {order.shipping_address}</p>
                                    <p><strong>Thanh toán:</strong> {order.payment_method}</p>
                                </div>

                                <div className="order-items">
                                    <h4>Sản phẩm:</h4>
                                    {order.items.map((item, index) => (
                                        <div key={index} className="order-item">
                                            <div className="item-image">
                                                <img 
                                                    src={item.productImage || '/placeholder.jpg'} 
                                                    alt={item.productName}
                                                    onError={(e) => {
                                                        e.target.src = '/placeholder.jpg';
                                                    }}
                                                />
                                            </div>
                                            <div className="item-info">
                                                <h5>{item.productName}</h5>
                                                <p>Shop: {item.shopName}</p>
                                                <p>Số lượng: {item.quantity}</p>
                                                <p>Giá: {item.price?.toLocaleString('vi-VN')}₫</p>
                                                <p><strong>Tổng: {item.subtotal?.toLocaleString('vi-VN')}₫</strong></p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="order-footer">
                                <div className="order-total">
                                    <h3>Tổng tiền: {order.total?.toLocaleString('vi-VN')}₫</h3>
                                </div>
                                <div className="order-actions">
                                    {order.status === 'pending' && (
                                        <button 
                                            className="cancel-btn"
                                            onClick={() => handleCancelOrder(order.orderId)}
                                        >
                                            Hủy đơn hàng
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default OrderStatus;

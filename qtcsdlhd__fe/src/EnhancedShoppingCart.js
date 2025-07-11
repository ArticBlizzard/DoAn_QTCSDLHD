import React, { useEffect, useState } from 'react';
import { useCart } from './contexts/CartContext';
import './EnhancedShoppingCart.css';

const EnhancedShoppingCart = ({ onPlaceOrder }) => {
    const {
        cart,
        loading,
        error,
        loadCart,
        updateQuantity: updateCartQuantity,
        removeFromCart: removeCartItem,
        clearCart: clearCartItems,
        setError
    } = useCart();
    
    const [updating, setUpdating] = useState({});

    useEffect(() => {
        loadCart();
    }, [loadCart]);

    const updateQuantity = async (productId, newQuantity) => {
        if (newQuantity < 0) return;
        
        setUpdating(prev => ({ ...prev, [productId]: true }));
        
        try {
            await updateCartQuantity(productId, newQuantity);
            setError('');
        } catch (err) {
            console.error('Error updating quantity:', err);
        } finally {
            setUpdating(prev => ({ ...prev, [productId]: false }));
        }
    };

    const removeItem = async (productId) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng?')) {
            return;
        }

        setUpdating(prev => ({ ...prev, [productId]: true }));
        
        try {
            await removeCartItem(productId);
            setError('');
        } catch (err) {
            console.error('Error removing item:', err);
        } finally {
            setUpdating(prev => ({ ...prev, [productId]: false }));
        }
    };

    const clearCart = async () => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa toàn bộ giỏ hàng?')) {
            return;
        }

        try {
            await clearCartItems();
            setError('');
        } catch (err) {
            console.error('Error clearing cart:', err);
        }
    };

    const handleCheckout = () => {
        if (!cart || cart.items.length === 0) {
            alert('Giỏ hàng trống');
            return;
        }
        
        // Convert cart format to match existing checkout logic
        const cartProducts = cart.items.map(item => ({
            _id: item.productId,
            name: item.productName,
            price: item.price,
            quantity: item.quantity,
            image_url: item.imageUrl,
            shopid: item.shopId,
            shopname: item.shopName
        }));

        onPlaceOrder(cartProducts);
    };

    if (loading) {
        return <div className="loading">Đang tải giỏ hàng...</div>;
    }

    if (!cart || cart.items.length === 0) {
        return (
            <div className="enhanced-cart-container">
                <h2>Giỏ hàng của bạn</h2>
                <div className="empty-cart">
                    <p>Giỏ hàng trống</p>
                    <p>Hãy thêm sản phẩm vào giỏ hàng để tiếp tục mua sắm</p>
                </div>
            </div>
        );
    }

    return (
        <div className="enhanced-cart-container">
            <div className="cart-header">
                <h2>Giỏ hàng của bạn ({cart.items.length} sản phẩm)</h2>
                <button className="clear-cart-btn" onClick={clearCart}>
                    Xóa toàn bộ
                </button>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="cart-items">
                {cart.items.map(item => (
                    <div key={item.productId} className="cart-item">
                        <div className="item-image">
                            <img 
                                src={item.imageUrl || '/placeholder.jpg'} 
                                alt={item.productName}
                                onError={(e) => {
                                    e.target.src = '/placeholder.jpg';
                                }}
                            />
                        </div>
                        
                        <div className="item-info">
                            <h3>{item.productName}</h3>
                            <p className="shop-name">Shop: {item.shopName}</p>
                            <p className="item-price">{item.price?.toLocaleString('vi-VN')}₫</p>
                        </div>
                        
                        <div className="quantity-controls">
                            <button 
                                className="quantity-btn"
                                onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                disabled={updating[item.productId] || item.quantity <= 1}
                            >
                                -
                            </button>
                            <span className="quantity">{item.quantity}</span>
                            <button 
                                className="quantity-btn"
                                onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                disabled={updating[item.productId]}
                            >
                                +
                            </button>
                        </div>
                        
                        <div className="item-total">
                            <p>{(item.price * item.quantity).toLocaleString('vi-VN')}₫</p>
                        </div>
                        
                        <button 
                            className="remove-btn"
                            onClick={() => removeItem(item.productId)}
                            disabled={updating[item.productId]}
                        >
                            {updating[item.productId] ? '...' : 'Xóa'}
                        </button>
                    </div>
                ))}
            </div>

            <div className="cart-summary">
                <div className="summary-row">
                    <span>Tạm tính:</span>
                    <span>{cart.total?.toLocaleString('vi-VN')}₫</span>
                </div>
                <div className="summary-row">
                    <span>Phí vận chuyển:</span>
                    <span>Miễn phí</span>
                </div>
                <div className="summary-row total">
                    <span>Tổng cộng:</span>
                    <span>{cart.total?.toLocaleString('vi-VN')}₫</span>
                </div>
                
                <button 
                    className="checkout-btn"
                    onClick={handleCheckout}
                >
                    Đặt hàng
                </button>
            </div>
        </div>
    );
};

export default EnhancedShoppingCart;

import React, { useState, useEffect } from 'react';
import './ShoppingCart.css'; // Import the CSS file

function ShoppingCart({ onPlaceOrder }) {
    const [cartProducts, setCartProducts] = useState([]);
    const [message, setMessage] = useState('');
    const [messageTimeoutId, setMessageTimeoutId] = useState(null); // New state for timeout ID
    const [shippingAddress, setShippingAddress] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('Tiền mặt');

    const displayMessage = (msg, duration = 3000) => {
        // Clear any existing timeout
        if (messageTimeoutId) {
            clearTimeout(messageTimeoutId);
        }
        setMessage(msg);
        const id = setTimeout(() => {
            setMessage('');
            setMessageTimeoutId(null);
        }, duration);
        setMessageTimeoutId(id);
    };

    const fetchCartProducts = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                displayMessage('Bạn cần đăng nhập để xem giỏ hàng.', 5000);
                return;
            }
            const response = await fetch('http://localhost:8080/api/customers/cart', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setCartProducts(data);
                // No success message needed here, just update cart
            } else {
                const errorText = await response.text();
                displayMessage(`Error fetching cart: ${errorText}`, 5000);
            }
        } catch (error) {
            displayMessage(`Network error fetching cart: ${error.message}`, 5000);
        }
    };

    useEffect(() => {
        fetchCartProducts();
    }, []);

    const handleUpdateQuantity = async (productId, quantity) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:8080/api/customers/cart/update-quantity/${productId}/${quantity}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                fetchCartProducts(); // Refresh cart
                displayMessage('Số lượng sản phẩm đã được cập nhật.');
            } else {
                const errorText = await response.text();
                displayMessage(`Error updating quantity: ${errorText}`, 5000);
            }
        } catch (error) {
            displayMessage(`Network error updating quantity: ${error.message}`, 5000);
        }
    };

    const handleRemoveProduct = async (productId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:8080/api/customers/cart/remove', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ productId })
            });
            if (response.ok) {
                fetchCartProducts(); // Refresh cart
                displayMessage('Sản phẩm đã được xóa khỏi giỏ hàng.');
            } else {
                const errorText = await response.text();
                displayMessage(`Error removing product: ${errorText}`, 5000);
            }
        } catch (error) {
            displayMessage(`Network error removing product: ${error.message}`, 5000);
        }
    };

    const handlePlaceOrder = async (e) => {
        e.preventDefault();
        if (!shippingAddress || !paymentMethod) {
            displayMessage("Vui lòng điền địa chỉ giao hàng và phương thức thanh toán.", 5000);
            return;
        }

        if (cartProducts.length === 0) {
            displayMessage("Giỏ hàng của bạn đang trống.", 5000);
            return;
        }

        const orderItems = cartProducts.map(item => ({
            productId: item._id,
            quantity: parseInt(item.quantity) // Ensure quantity is an integer
        }));

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:8080/api/customers/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    shippingAddress,
                    paymentMethod,
                    items: orderItems
                })
            });

            if (response.ok) {
                const orderId = await response.text();
                // setMessage(`Đơn hàng đã được tạo thành công! Mã đơn hàng: ${orderId}`); // Removed this line
                setCartProducts([]); // Clear cart after order
                setShippingAddress('');
                setPaymentMethod('');
                onPlaceOrder(orderId); // Let parent component handle success message
            } else {
                const errorText = await response.text();
                displayMessage(`Lỗi tạo đơn hàng: ${errorText}`, 5000);
            }
        } catch (error) {
            displayMessage(`Lỗi mạng khi tạo đơn hàng: ${error.message}`, 5000);
        }
    };

    const calculateTotal = () => {
        return cartProducts.reduce((sum, item) => {
            const price = parseFloat(item.price);
            const quantity = parseInt(item.quantity);
            if (isNaN(price) || isNaN(quantity)) {
                return sum; // Skip if either is not a number
            }
            return sum + (price * quantity);
        }, 0);
    };

    return (
        <div className="shopping-cart-container">
            <h2>Giỏ hàng của bạn</h2>
            {message && <p className="message error">{message}</p>}

            {cartProducts.length > 0 ? (
                <div className="cart-list">
                    {cartProducts.map(product => (
                        <div key={product._id} className="cart-item">
                            <div
                                className="product-thumbnail"
                                style={product.image_url ? {
                                    backgroundImage: `url(${product.image_url})`,
                                    backgroundSize: 'cover',
                                    backgroundRepeat: 'no-repeat',
                                    backgroundPosition: 'center',
                                } : {}}
                            >
                                {!product.image_url && <div className="no-image-thumbnail"></div>}
                            </div>
                            <div className="cart-item-details">
                                <h3>{product.name}</h3>
                                <p className="price">{product.price.toLocaleString('vi-VN')} VND</p>
                            </div>
                            <div className="quantity-control">
                                <button onClick={() => handleUpdateQuantity(product._id, product.quantity - 1)}>-</button>
                                <span>{product.quantity}</span>
                                <button onClick={() => handleUpdateQuantity(product._id, product.quantity + 1)}>+</button>
                            </div>
                            <button onClick={() => handleRemoveProduct(product._id)} className="remove-btn">Xóa</button>
                        </div>
                    ))}
                    <h3 className="cart-total">Tổng cộng: {calculateTotal().toLocaleString('vi-VN')} VND</h3>

                    <form onSubmit={handlePlaceOrder} className="order-form">
                        <h4>Thông tin đặt hàng</h4>
                        <div className="form-group">
                            <label htmlFor="shippingAddress">Địa chỉ giao hàng</label>
                            <input type="text" id="shippingAddress" value={shippingAddress} onChange={e => setShippingAddress(e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="paymentMethod">Phương thức thanh toán</label>
                            <input type="text" id="paymentMethod" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} required />
                        </div>
                        <button type="submit" className="submit-btn">Tạo đơn hàng</button>
                    </form>
                </div>
            ) : (
                <p>Giỏ hàng của bạn trống.</p>
            )}
        </div>
    );
}

export default ShoppingCart;
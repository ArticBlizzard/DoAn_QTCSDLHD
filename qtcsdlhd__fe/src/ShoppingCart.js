import React, { useState, useEffect } from 'react';
import './ShoppingCart.css'; // Import the CSS file

function ShoppingCart({ onPlaceOrder }) {
    const [cartProducts, setCartProducts] = useState([]);
    const [message, setMessage] = useState('');
    const [messageTimeoutId, setMessageTimeoutId] = useState(null); // New state for timeout ID
    const [shippingAddress, setShippingAddress] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('Tiền mặt');
    const [userAddresses, setUserAddresses] = useState([]); // Store list of user addresses
    const [selectedAddressIndex, setSelectedAddressIndex] = useState(-1); // -1 means custom address
    const [fullName, setFullName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [bankAccount, setBankAccount] = useState(null);
    const [availableVouchers, setAvailableVouchers] = useState({});
    const [selectedVouchers, setSelectedVouchers] = useState({});

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

    const fetchUserProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await fetch('http://localhost:8080/api/users/me', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setFullName(data.fullName || '');

                if (data.buyerProfile) {
                    setPhoneNumber(data.buyerProfile.phoneNumber || '');
                    setBankAccount(data.buyerProfile.bankAccount || null);

                    if (data.buyerProfile.primaryAddress) {
                        const primaryAddress = data.buyerProfile.primaryAddress;
                        const formattedAddress = `${primaryAddress.street}, ${primaryAddress.ward}, ${primaryAddress.district}, ${primaryAddress.city}`;
                        setShippingAddress(formattedAddress);
                    }

                    if (data.buyerProfile.addresses) {
                        setUserAddresses(data.buyerProfile.addresses);
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching user profile:', error);
        }
    };

    const fetchVouchersForProduct = async (productId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:8080/api/vouchers/product/${productId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const vouchers = await response.json();
                setAvailableVouchers(prev => ({
                    ...prev,
                    [productId]: vouchers
                }));
            }
        } catch (error) {
            console.error('Error fetching vouchers:', error);
        }
    };

    const handleVoucherSelect = (productId, voucherId) => {
        setSelectedVouchers(prev => ({
            ...prev,
            [productId]: voucherId
        }));
    };

    useEffect(() => {
        fetchCartProducts();
        fetchUserProfile(); // Fetch user profile when component mounts
    }, []);

    useEffect(() => {
        // Fetch vouchers for each product in cart
        cartProducts.forEach(product => {
            fetchVouchersForProduct(product._id);
        });
    }, [cartProducts]);

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

    const calculateItemTotal = (item) => {
        const price = parseFloat(item.price);
        const quantity = parseInt(item.quantity);
        let total = price * quantity;

        // Apply voucher discount if selected
        const selectedVoucher = selectedVouchers[item._id];
        const productVouchers = availableVouchers[item._id] || [];
        const voucher = productVouchers.find(v => v.id === selectedVoucher);

        if (voucher) {
            if (voucher.discountType === 'PERCENTAGE') {
                total = total * (1 - voucher.discountValue / 100);
            } else if (voucher.discountType === 'FIXED') {
                total = total - voucher.discountValue;
            }
        }

        return total;
    };

    const calculateTotal = () => {
        return cartProducts.reduce((sum, item) => {
            return sum + calculateItemTotal(item);
        }, 0);
    };

    const handlePlaceOrder = async (e) => {
        e.preventDefault();
        if (!shippingAddress || !paymentMethod || !fullName || !phoneNumber) {
            displayMessage("Vui lòng điền đầy đủ thông tin giao hàng.", 5000);
            return;
        }

        if (paymentMethod === 'Thẻ ngân hàng' && !bankAccount) {
            displayMessage("Vui lòng cập nhật thông tin tài khoản ngân hàng trong hồ sơ.", 5000);
            return;
        }

        if (cartProducts.length === 0) {
            displayMessage("Giỏ hàng của bạn đang trống.", 5000);
            return;
        }

        const orderItems = cartProducts.map(item => ({
            productId: item._id,
            quantity: parseInt(item.quantity),
            voucherId: selectedVouchers[item._id]
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
                    fullName,
                    phoneNumber,
                    shippingAddress,
                    paymentMethod,
                    bankAccount: paymentMethod === 'Thẻ ngân hàng' ? bankAccount : null,
                    items: orderItems
                })
            });

            if (response.ok) {
                const orderId = await response.text();
                setCartProducts([]);
                setShippingAddress('');
                setPaymentMethod('Tiền mặt');
                setSelectedVouchers({});
                onPlaceOrder(orderId);
            } else {
                const errorText = await response.text();
                displayMessage(`Lỗi tạo đơn hàng: ${errorText}`, 5000);
            }
        } catch (error) {
            displayMessage(`Lỗi mạng khi tạo đơn hàng: ${error.message}`, 5000);
        }
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
                                {product.stock === 0 && (
                                    <img src="/soldout.png" alt="Sold Out" className="sold-out-overlay" />
                                )}
                            </div>
                            <div className="cart-item-details">
                                <h3>{product.name}</h3>
                                <p className="product-shop-name">Cửa hàng: {product.shop_name}</p>
                                <p className="price">{product.price.toLocaleString('vi-VN')} VND</p>
                                <p className="stock">Tồn kho: {product.stock}</p>
                                <div className="voucher-section">
                                    {(availableVouchers[product._id]?.length > 0) ? (
                                        <select
                                            value={selectedVouchers[product._id] || ''}
                                            onChange={(e) => handleVoucherSelect(product._id, e.target.value)}
                                            className="voucher-select"
                                        >
                                            <option value="">Chọn voucher</option>
                                            {(availableVouchers[product._id] || []).map(voucher => (
                                                <option key={voucher.id} value={voucher.id}>
                                                    {voucher.discountType === 'PERCENTAGE'
                                                        ? `Giảm ${voucher.discountValue}%`
                                                        : `Giảm ${voucher.discountValue.toLocaleString('vi-VN')} VND`}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <div className="no-voucher-message">
                                            Không có voucher khả dụng
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="quantity-control">
                                <button onClick={() => handleUpdateQuantity(product._id, product.quantity - 1)}>-</button>
                                <span>{product.quantity}</span>
                                <button onClick={() => handleUpdateQuantity(product._id, product.quantity + 1)}>+</button>
                            </div>
                            <div className="price-info">
                                {selectedVouchers[product._id] ? (
                                    <>
                                        <p className="original-price">
                                            {(product.price * product.quantity).toLocaleString('vi-VN')} VND
                                        </p>
                                        <p className="discounted-price">
                                            {calculateItemTotal(product).toLocaleString('vi-VN')} VND
                                        </p>
                                    </>
                                ) : (
                                    <p className="normal-price">
                                        {(product.price * product.quantity).toLocaleString('vi-VN')} VND
                                    </p>
                                )}
                            </div>
                            <button onClick={() => handleRemoveProduct(product._id)} className="remove-btn">Xóa</button>
                        </div>
                    ))}
                    <h3 className="cart-total">Tổng cộng: {calculateTotal().toLocaleString('vi-VN')} VND</h3>

                    <form onSubmit={handlePlaceOrder} className="order-form">
                        <h4>Thông tin đặt hàng</h4>
                        <div className="form-group">
                            <label htmlFor="fullName">Họ và tên người nhận</label>
                            <input
                                type="text"
                                id="fullName"
                                value={fullName}
                                onChange={e => setFullName(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="phoneNumber">Số điện thoại</label>
                            <input
                                type="tel"
                                id="phoneNumber"
                                value={phoneNumber}
                                onChange={e => setPhoneNumber(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="shippingAddress">Địa chỉ giao hàng</label>
                            {userAddresses.length > 0 && (
                                <select
                                    value={selectedAddressIndex}
                                    onChange={(e) => {
                                        const idx = parseInt(e.target.value);
                                        setSelectedAddressIndex(idx);
                                        if (idx === -1) {
                                            setShippingAddress('');
                                        } else {
                                            const addr = userAddresses[idx];
                                            setShippingAddress(`${addr.street}, ${addr.ward}, ${addr.district}, ${addr.city}`);
                                        }
                                    }}
                                    className="address-select"
                                >
                                    <option value={-1}>Địa chỉ khác</option>
                                    {userAddresses.map((addr, idx) => (
                                        <option key={idx} value={idx}>
                                            {`${addr.street}, ${addr.ward}, ${addr.district}, ${addr.city}`}
                                        </option>
                                    ))}
                                </select>
                            )}
                            <input
                                type="text"
                                id="shippingAddress"
                                value={shippingAddress}
                                onChange={e => {
                                    setShippingAddress(e.target.value);
                                    setSelectedAddressIndex(-1);
                                }}
                                required
                                placeholder={selectedAddressIndex === -1 ? "Nhập địa chỉ giao hàng" : ""}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="paymentMethod">Phương thức thanh toán</label>
                            <select
                                id="paymentMethod"
                                value={paymentMethod}
                                onChange={e => setPaymentMethod(e.target.value)}
                                required
                            >
                                <option value="Tiền mặt">Tiền mặt khi nhận hàng</option>
                                <option value="Thẻ ngân hàng">Thanh toán bằng thẻ ngân hàng</option>
                            </select>
                        </div>

                        {paymentMethod === 'Thẻ ngân hàng' && bankAccount && (
                            <div className="bank-info">
                                <h5>Thông tin tài khoản ngân hàng</h5>
                                <div className="bank-details">
                                    <p><strong>Ngân hàng:</strong> {bankAccount.bankName}</p>
                                    <p><strong>Số tài khoản:</strong> {bankAccount.accountNumber}</p>
                                    <p><strong>Chủ tài khoản:</strong> {bankAccount.accountHolder}</p>
                                </div>
                            </div>
                        )}

                        <button type="submit" className="place-order-btn">Đặt hàng</button>
                    </form>
                </div>
            ) : (
                <p>Giỏ hàng trống</p>
            )}
        </div>
    );
}

export default ShoppingCart;
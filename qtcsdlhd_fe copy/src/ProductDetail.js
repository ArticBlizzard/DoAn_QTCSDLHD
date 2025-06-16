import React, { useState, useEffect } from 'react';
import './ProductDetail.css'; // Make sure to create this CSS file

function ProductDetail({ productId, onBack, onAddToCart }) {
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [addingToCart, setAddingToCart] = useState(false);

    useEffect(() => {
        const fetchProductDetail = async () => {
            try {
                setLoading(true);
                setError('');
                const response = await fetch(`http://localhost:8080/api/products/${productId}`);
                if (response.ok) {
                    const data = await response.json();
                    setProduct(data);
                } else {
                    const errorText = await response.text();
                    setError(`Không thể tải thông tin sản phẩm: ${errorText}`);
                }
            } catch (err) {
                setError(`Lỗi kết nối: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };

        if (productId) {
            fetchProductDetail();
        }
    }, [productId]);

    const handleQuantityChange = (e) => {
        const value = parseInt(e.target.value);
        if (!isNaN(value) && value > 0) {
            setQuantity(Math.min(value, product?.stock || 1));
        }
    };

    const handleAddToCartClick = async () => {
        if (!product || product.stock <= 0) {
            alert('Sản phẩm này hiện không có sẵn hoặc hết hàng.');
            return;
        }

        try {
            setAddingToCart(true);
            const success = await onAddToCart(product._id, quantity);
            if (success) {
                alert(`Đã thêm ${quantity} sản phẩm ${product.name} vào giỏ hàng!`);
                // Refresh product stock
                const response = await fetch(`http://localhost:8080/api/products/${productId}`);
                if (response.ok) {
                    const updatedProduct = await response.json();
                    setProduct(updatedProduct);
                }
            }
        } catch (err) {
            alert('Có lỗi xảy ra khi thêm vào giỏ hàng. Vui lòng thử lại.');
        } finally {
            setAddingToCart(false);
        }
    };

    if (loading) {
        return (
            <div className="product-detail-container loading">
                <div className="loading-spinner"></div>
                <p>Đang tải chi tiết sản phẩm...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="product-detail-container error">
                <p className="error-message">{error}</p>
                <button onClick={onBack} className="back-button">← Quay lại danh sách sản phẩm</button>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="product-detail-container not-found">
                <p>Không tìm thấy thông tin sản phẩm.</p>
                <button onClick={onBack} className="back-button">← Quay lại danh sách sản phẩm</button>
            </div>
        );
    }

    return (
        <div className="product-detail-container">
            <button onClick={onBack} className="back-button">← Quay lại danh sách sản phẩm</button>
            <div className="product-detail-content">
                <div
                    className="product-images"
                    style={product.image_url ? {
                        backgroundImage: `url(${product.image_url})`,
                        backgroundSize: 'contain',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'center',
                    } : {}}
                >
                    {!product.image_url && <div className="no-image">Không có hình ảnh</div>}
                </div>
                <div className="product-info">
                    <h2 className="product-name">{product.name}</h2>
                    <p className="description"><strong>Mô tả:</strong> {product.description}</p>
                    <p className="price"><strong>Giá:</strong> {product.price.toLocaleString('vi-VN')} VND</p>
                    <p className="stock"><strong>Tồn kho:</strong> {product.stock}</p>
                    <p className="category"><strong>Danh mục:</strong> {product.category}</p>
                    <p className="shop-name"><strong>Cửa hàng:</strong> {product.shop_name}</p>

                    <div className="add-to-cart-section">
                        <label htmlFor="quantity">Số lượng:</label>
                        <input
                            type="number"
                            id="quantity"
                            value={quantity}
                            onChange={handleQuantityChange}
                            min="1"
                            max={product.stock}
                            disabled={product.stock <= 0}
                        />
                        <button
                            onClick={handleAddToCartClick}
                            disabled={product.stock <= 0 || quantity > product.stock || addingToCart}
                            className="add-to-cart-button"
                        >
                            {addingToCart ? 'Đang thêm...' : 'Thêm vào giỏ hàng'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProductDetail; 
import React, { useState, useEffect } from 'react';
import './ProductCatalog.css';

function ProductCatalog({ onAddToCart, onProductView }) {
    const [products, setProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [message, setMessage] = useState('');

    const fetchProducts = async (term = '') => {
        try {
            let url = 'http://localhost:8080/api/products';
            if (term) {
                url = `http://localhost:8080/api/products/search?keyword=${term}`;
            }
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                setProducts(data);
                setMessage('');
            } else {
                setMessage(`Error fetching products: ${response.statusText}`);
            }
        } catch (error) {
            setMessage(`Network error fetching products: ${error.message}`);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchProducts(searchTerm);
    };

    return (
        <div className="product-catalog-container">
            <h2>Danh sách sản phẩm</h2>
            <form onSubmit={handleSearch} className="search-bar">
                <input
                    type="text"
                    placeholder="Tìm kiếm sản phẩm..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button type="submit">Tìm kiếm</button>
            </form>

            {message && <p className="message error">{message}</p>}

            <div className="product-list">
                {products.length > 0 ? (
                    products.map(product => (
                        <div key={product._id} className="product-item">
                            <div
                                className="product-image-container"
                                style={product.image_url ? { backgroundImage: `url(${product.image_url})` } : {}}
                            >
                                {!product.image_url && <div className="no-image">Không có hình ảnh</div>}
                            </div>
                            <h3>{product.name}</h3>
                            <p className="price">{product.price.toLocaleString('vi-VN')} VND</p>
                            <p className="stock">Tồn kho: {product.stock}</p>
                            <div className="actions">
                                <button onClick={() => onProductView(product._id)} className="secondary-btn">Xem chi tiết</button>
                            </div>
                        </div>
                    ))
                ) : (
                    <p>Không tìm thấy sản phẩm nào.</p>
                )}
            </div>
        </div>
    );
}

export default ProductCatalog; 
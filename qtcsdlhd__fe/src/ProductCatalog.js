import React, { useState, useEffect } from 'react';
import './ProductCatalog.css';

function ProductCatalog({ onAddToCart, onProductView }) {
    const [products, setProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [message, setMessage] = useState('');
    const [categories, setCategories] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [sortOption, setSortOption] = useState('');

    const fetchCategories = async () => {
        try {
            const response = await fetch('http://localhost:8080/api/products/categories');
            if (response.ok) {
                const data = await response.json();
                setCategories(data);
            } else {
                console.error('Error fetching categories:', response.statusText);
            }
        } catch (error) {
            console.error('Network error fetching categories:', error.message);
        }
    };

    const fetchProducts = async (term = '', category = '', sort = '') => {
        try {
            let url = 'http://localhost:8080/api/products';
            const params = new URLSearchParams();

            if (term) {
                params.append('keyword', term);
            }
            if (category) {
                params.append('category', category);
            }
            if (sort) {
                params.append('sort', sort);
            }

            if (params.toString()) {
                url = `http://localhost:8080/api/products/search?${params.toString()}`;
            } else {
                url = 'http://localhost:8080/api/products/all';
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
        fetchCategories();
    }, []);

    const handleSearchTermChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        fetchProducts(searchTerm, '', sortOption);
        setShowSuggestions(false);
    };

    const handleCategoryClick = (categoryName) => {
        setSearchTerm(categoryName);
        fetchProducts('', categoryName, sortOption);
        setShowSuggestions(false);
    };

    const handleSortChange = (e) => {
        const newSortOption = e.target.value;
        setSortOption(newSortOption);
        fetchProducts(searchTerm, '', newSortOption);
    };

    return (
        <div className="product-catalog-container">
            <h2>Danh sách sản phẩm</h2>
            <form onSubmit={handleSearchSubmit} className="search-bar">
                <input
                    type="text"
                    placeholder="Tìm kiếm sản phẩm..."
                    value={searchTerm}
                    onChange={handleSearchTermChange}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 100)}
                />
                <button type="submit">Tìm kiếm</button>
            </form>

            {showSuggestions && categories.length > 0 && (
                <div className="category-suggestions">
                    <h3>Danh mục gợi ý:</h3>
                    <ul>
                        {categories.slice(0, 6).map(category => (
                            <li key={category} onClick={() => handleCategoryClick(category)}>
                                {category}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="sort-options">
                <label htmlFor="sort">Sắp xếp theo:</label>
                <select id="sort" value={sortOption} onChange={handleSortChange}>
                    <option value="">Mặc định</option>
                    <option value="priceAsc">Giá: Thấp đến Cao</option>
                    <option value="priceDesc">Giá: Cao đến Thấp</option>
                    <option value="newest">Mới nhất</option>
                    <option value="oldest">Cũ nhất</option>
                </select>
            </div>

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
                                {product.stock === 0 && (
                                    <img src="/soldout.png" alt="Sold Out" className="sold-out-overlay" />
                                )}
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
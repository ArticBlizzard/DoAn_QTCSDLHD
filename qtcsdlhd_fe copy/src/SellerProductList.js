import React, { useEffect, useState } from 'react';
import axios from 'axios';
import AddProduct from './AddProduct';
import ProductDetail from './ProductDetail';
import EditProduct from './EditProduct';
import './SellerProductList.css';

const SellerProductList = ({ onBack }) => {
  const [productsByCategory, setProductsByCategory] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editProduct, setEditProduct] = useState(null);
  const [activeCategory, setActiveCategory] = useState('ALL');

  const fetchProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:8080/api/products/mine', {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Group products by category
      const grouped = {};
      res.data.forEach(product => {
        const cat = product.category || 'Khác';
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(product);
      });
      setProductsByCategory(grouped);
      // Không setActiveCategory ở đây nữa để giữ nguyên trạng thái (ALL khi vào, hoặc category khi thêm)
    } catch (err) {
      setError('Không thể tải sản phẩm.');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleAddSuccess = (newCategory) => {
    setShowAdd(false);
    fetchProducts().then(() => {
      if (newCategory) setActiveCategory(newCategory);
    });
  };

  const handleEditSave = () => {
    setEditProduct(null);
    setSelectedProduct(null);
    fetchProducts();
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:8080/api/products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchProducts();
    } catch (err) {
      alert('Xóa sản phẩm thất bại!');
    }
  };

  const categories = Object.keys(productsByCategory);
  const allProducts = categories.reduce((arr, cat) => arr.concat(productsByCategory[cat]), []);

  return (
    <div className="seller-product-list-container">
      {/* Tabs category, thêm tab Tất cả */}
      {loading ? (
        <p>Đang tải...</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : categories.length === 0 ? (
        <p>Chưa có sản phẩm nào.</p>
      ) : (
        <div className="category-tabs">
          <button
            className={`category-tab${activeCategory === 'ALL' ? ' active' : ''}`}
            onClick={() => setActiveCategory('ALL')}
          >
            Tất cả
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              className={`category-tab${activeCategory === cat ? ' active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      )}
      {/* Hiển thị sản phẩm theo tab */}
      {activeCategory && (
        <div className="products-list">
          {(activeCategory === 'ALL' ? allProducts : productsByCategory[activeCategory] || []).map(product => (
            <div className="product-card" key={product.id} style={{position:'relative', display:'flex', flexDirection:'column', justifyContent:'space-between', minHeight:'340px'}}>
              <div onClick={() => setSelectedProduct(product)} style={{cursor:'pointer'}}>
                <img src={product.imageUrl} alt={product.name} className="product-img" />
                <h4>{product.name}</h4>
                <p><strong>Giá:</strong> {product.price.toLocaleString()} VND</p>
                <p><strong>Số lượng:</strong> {product.stock}</p>
              </div>
              <button className="delete-btn" onClick={() => handleDelete(product.id)} style={{alignSelf:'flex-end', marginTop:'auto', marginBottom:'4px'}}>Xóa</button>
            </div>
          ))}
        </div>
      )}
      <div style={{marginTop: 32}}>
        <button className="add-btn" onClick={() => setShowAdd(true)}>
          Thêm sản phẩm
        </button>
        {showAdd && (
          <div className="add-product-modal-bg">
            <div className="add-product-modal-content">
              <AddProduct onSuccess={handleAddSuccess} />
              <button className="close-btn" onClick={() => setShowAdd(false)} style={{position:'absolute',top:12,right:16,fontSize:28}}>×</button>
            </div>
          </div>
        )}
      </div>
      {selectedProduct && !editProduct && (
        <ProductDetail 
          product={selectedProduct} 
          onClose={() => setSelectedProduct(null)} 
          onEdit={() => setEditProduct(selectedProduct)}
        />
      )}
      {editProduct && (
        <EditProduct 
          product={editProduct} 
          onClose={() => setEditProduct(null)} 
          onSave={handleEditSave}
        />
      )}
    </div>
  );
};

export default SellerProductList;

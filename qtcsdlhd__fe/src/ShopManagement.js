import React, { useEffect, useState } from 'react';
import SellerProduct from './SellerProduct';
import { FaTrash } from 'react-icons/fa';
import './ShopManagement.css';

function ShopManagement() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/seller/products/mine', {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Network response was not ok');
      const data = await res.json();
      setProducts(data);
      const cats = Array.from(new Set(data.map(p => p.category).filter(Boolean)));
      setCategories(cats);
    } catch (err) {
      alert('Không thể tải sản phẩm');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa sản phẩm này?')) return;
    try {
      const res = await fetch(`http://localhost:8080/api/seller/products/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Delete failed');
      setProducts(products.filter(p => p._id !== id));
    } catch (err) {
      alert('Xóa thất bại');
    }
  };

  const handleEdit = (product) => {
    setEditProduct(product);
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditProduct(null);
    setShowForm(true);
  };

  const handleFormClose = (reload) => {
    setShowForm(false);
    setEditProduct(null);
    if (reload) fetchProducts();
  };

  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter(p => p.category === selectedCategory);

  return (
    <div className="shop-management">
      <h2>Quản lý Shop</h2>
      <button onClick={handleAdd}>Thêm sản phẩm</button>
      <div style={{ margin: '16px 0' }}>
        <label>Danh mục: </label>
        <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
          <option value="all">Tất cả</option>
          {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
      </div>
      <div className="product-list">
        {filteredProducts.map(product => (
          <div key={product._id} className="product-item" style={{ border: '1px solid #ccc', padding: 12, marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div onClick={() => handleEdit(product)} style={{ cursor: 'pointer' }}>
                <strong>{product.name}</strong> <br />
                <span>Danh mục: {product.category}</span>
              </div>
              <button onClick={() => handleDelete(product._id)} style={{ background: 'none', border: 'none', color: 'red', cursor: 'pointer' }} title="Xóa">
                <FaTrash size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
      {showForm && <SellerProduct product={editProduct} onClose={handleFormClose} />}
    </div>
  );
}

export default ShopManagement;

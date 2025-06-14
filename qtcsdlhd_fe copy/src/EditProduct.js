import React, { useState } from 'react';
import axios from 'axios';
import './EditProduct.css';

const EditProduct = ({ product, onClose, onSave }) => {
  const [form, setForm] = useState({
    name: product.name || '',
    description: product.description || '',
    price: product.price || '',
    imageUrl: product.imageUrl || '',
    category: product.category || '',
    stock: product.stock || '',
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:8080/api/products/${product.id}`,
        {
          ...form,
          price: parseFloat(form.price),
          stock: parseInt(form.stock, 10),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setMessage('Cập nhật thành công!');
      if (onSave) onSave();
    } catch (err) {
      setMessage(err.response?.data || 'Có lỗi xảy ra!');
    }
    setLoading(false);
  };

  return (
    <div className="edit-product-modal">
      <div className="edit-product-content">
        <button className="close-btn" onClick={onClose}>×</button>
        <h2>Chỉnh sửa sản phẩm</h2>
        <form onSubmit={handleSubmit} className="edit-product-form">
          <input name="name" value={form.name} onChange={handleChange} placeholder="Tên sản phẩm" required />
          <textarea name="description" value={form.description} onChange={handleChange} placeholder="Mô tả" required />
          <input name="price" value={form.price} onChange={handleChange} placeholder="Giá" type="number" min="0" step="0.01" required />
          <input name="imageUrl" value={form.imageUrl} onChange={handleChange} placeholder="Link ảnh" />
          <input name="category" value={form.category} onChange={handleChange} placeholder="Danh mục" />
          <input name="stock" value={form.stock} onChange={handleChange} placeholder="Số lượng" type="number" min="0" required />
          <button type="submit" disabled={loading}>{loading ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
        </form>
        {message && <div className="edit-product-message">{message}</div>}
      </div>
    </div>
  );
};

export default EditProduct;

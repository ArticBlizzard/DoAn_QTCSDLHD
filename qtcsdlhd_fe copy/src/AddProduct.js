import React, { useState } from 'react';
import axios from 'axios';
import './AddProduct.css';

const AddProduct = () => {
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    imageUrl: '',
    category: '',
    stock: '',
  });
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        'http://localhost:8080/api/products/create',
        {
          ...form,
          price: parseFloat(form.price),
          stock: parseInt(form.stock, 10),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setMessage('Thêm sản phẩm thành công!');
      setForm({ name: '', description: '', price: '', imageUrl: '', category: '', stock: '' });
    } catch (err) {
      setMessage(err.response?.data || 'Có lỗi xảy ra!');
    }
  };

  return (
    <div className="add-product-container">
      <h2>Thêm sản phẩm mới</h2>
      <form onSubmit={handleSubmit} className="add-product-form">
        <input name="name" value={form.name} onChange={handleChange} placeholder="Tên sản phẩm" required />
        <textarea name="description" value={form.description} onChange={handleChange} placeholder="Mô tả" required />
        <input name="price" value={form.price} onChange={handleChange} placeholder="Giá" type="number" min="0" step="0.01" required />
        <input name="imageUrl" value={form.imageUrl} onChange={handleChange} placeholder="Link ảnh" />
        <input name="category" value={form.category} onChange={handleChange} placeholder="Danh mục" />
        <input name="stock" value={form.stock} onChange={handleChange} placeholder="Số lượng" type="number" min="0" required />
        <button type="submit">Thêm sản phẩm</button>
      </form>
      {message && <div className="add-product-message">{message}</div>}
    </div>
  );
};

export default AddProduct;

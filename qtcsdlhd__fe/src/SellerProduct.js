import React, { useState } from 'react';
import './SellerProduct.css';

function SellerProduct({ product, onClose }) {
  const isEdit = !!product;
  const [form, setForm] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price || '',
    stock: product?.stock || '',
    image_url: product?.image_url || '',
    category: product?.category || '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      let res;
      if (isEdit) {
        res = await fetch(`http://localhost:8080/api/seller/products/${product._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(form),
        });
      } else {
        res = await fetch('http://localhost:8080/api/seller/products/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(form),
        });
      }
      if (!res.ok) throw new Error('Save failed');
      onClose(true);
    } catch (err) {
      alert('Lưu thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: '#0008', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <form onSubmit={handleSubmit} style={{ background: '#fff', padding: 24, borderRadius: 8, minWidth: 320 }}>
        <h3>{isEdit ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm'}</h3>
        <input name="name" value={form.name} onChange={handleChange} placeholder="Tên sản phẩm" required style={{ width: '100%', marginBottom: 8 }} />
        <input name="category" value={form.category} onChange={handleChange} placeholder="Danh mục" required style={{ width: '100%', marginBottom: 8 }} />
        <input name="price" value={form.price} onChange={handleChange} placeholder="Giá" type="number" required style={{ width: '100%', marginBottom: 8 }} />
        <input name="stock" value={form.stock} onChange={handleChange} placeholder="Số lượng" type="number" required style={{ width: '100%', marginBottom: 8 }} />
        <input name="image_url" value={form.image_url} onChange={handleChange} placeholder="Link ảnh" style={{ width: '100%', marginBottom: 8 }} />
        <textarea name="description" value={form.description} onChange={handleChange} placeholder="Mô tả" style={{ width: '100%', marginBottom: 8 }} />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" onClick={() => onClose(false)} disabled={loading}>Hủy</button>
          <button type="submit" disabled={loading}>{loading ? 'Đang lưu...' : 'Lưu'}</button>
        </div>
      </form>
    </div>
  );
}

export default SellerProduct;

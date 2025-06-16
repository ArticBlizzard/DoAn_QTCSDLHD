import React from 'react';
import './ProductDetail.css';

const ProductDetail = ({ product, onClose, onEdit }) => {
  if (!product) return null;
  return (
    <div className="product-detail-modal">
      <div className="product-detail-content">
        <button className="close-btn" onClick={onClose}>×</button>
        <img src={product.imageUrl} alt={product.name} className="product-detail-img" />
        <h2>{product.name}</h2>
        <p><strong>Danh mục:</strong> {product.category}</p>
        <p><strong>Mô tả:</strong> {product.description}</p>
        <p><strong>Giá:</strong> {product.price.toLocaleString()} VND</p>
        <p><strong>Số lượng:</strong> {product.stock}</p>
        <button className="edit-btn" onClick={onEdit} style={{marginTop: 16}}>Chỉnh sửa</button>
      </div>
    </div>
  );
};

export default ProductDetail;

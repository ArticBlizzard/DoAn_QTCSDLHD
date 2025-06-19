import React, { useEffect, useState } from 'react';
import SellerProduct from './SellerProduct';
import VoucherManagement from './VoucherManagement';
import './ShopManagement.css';

function ShopManagement() {
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');
  const [detailProduct, setDetailProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortField, setSortField] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const [deleteProductId, setDeleteProductId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [vouchers, setVouchers] = useState([]);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchVouchers();
  }, []);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:8080/api/seller/products/mine', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Network response was not ok');
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      alert('Không thể tải sản phẩm');
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/categories');
      if (!res.ok) throw new Error('Network response was not ok');
      const data = await res.json();
      setCategories(data);
    } catch (err) {
      console.error('Failed to fetch categories', err);
    }
  };

  const fetchVouchers = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch('http://localhost:8080/api/vouchers/shop', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      setVouchers(await res.json());
    } else {
      setVouchers([]);
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

  // Lọc sản phẩm theo tab và category
  const filteredProducts = products.filter(p => {
    let matchTab = true;
    if (tab === 'all') matchTab = true;
    if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return matchTab;
  });

  // Sắp xếp sản phẩm theo trường được chọn
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (!sortField) return 0;
    let aValue = a[sortField] || 0;
    let bValue = b[sortField] || 0;
    if (typeof aValue === 'string') aValue = aValue.toLowerCase();
    if (typeof bValue === 'string') bValue = bValue.toLowerCase();
    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // Hàm xử lý khi click vào tiêu đề cột để sắp xếp
  function handleSort(field) {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  }

  // Hàm xóa sản phẩm
  function handleDelete(id) {
    setDeleteProductId(id);
    setShowDeleteModal(true);
  }
  function confirmDelete() {
    const id = deleteProductId;
    setShowDeleteModal(false);
    setDeleteProductId(null);
    if (!id) return;
    try {
      const token = localStorage.getItem('token');
      fetch(`http://localhost:8080/api/seller/products/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }).then(res => {
        if (!res.ok) throw new Error('Delete failed');
        setProducts(products => products.filter(p => p._id !== id));
      }).catch(() => alert('Xóa thất bại'));
    } catch (err) {
      alert('Xóa thất bại');
    }
  }

  // Lấy danh sách category duy nhất từ sản phẩm
  const uniqueCategories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));

  // Hàm xử lý thay đổi category
  function handleCategoryChange(e) {
    setSelectedCategory(e.target.value);
  }

  // Hàm lấy mã voucher áp dụng cho sản phẩm
  function getVoucherCodeForProduct(productId) {
    const voucher = vouchers.find(v => Array.isArray(v.productIds) && v.productIds.includes(productId));
    return voucher ? voucher.code : 'Chưa áp dụng';
  }

  // Thêm hàm xử lý hủy áp dụng voucher
  function handleRemoveVoucher(productId) {
    const token = localStorage.getItem('token');
    const voucher = vouchers.find(v => Array.isArray(v.productIds) && v.productIds.includes(productId));
    if (!voucher) {
      alert('Không tìm thấy voucher để hủy');
      return;
    }
    fetch('http://localhost:8080/api/vouchers/remove-product', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ voucherId: voucher.id, productId })
    })
      .then(async res => {
        const text = await res.text();
        if (!res.ok) throw new Error(text || 'Hủy áp dụng voucher thất bại');
        fetchVouchers();
        alert('Hủy áp dụng voucher thành công');
      })
      .catch((err) => alert('Hủy áp dụng voucher thất bại: ' + err.message));
  }

  return (
    <div className="product-management-page">
      <div className="sidebar">
        <div className="sidebar-title">Quản Lý Sản Phẩm</div>
        <div className="sidebar-item active">Tất Cả Sản Phẩm</div>
        {/* Đã bỏ mục Thêm Sản Phẩm */}
      </div>
      <div className="main-content">
        <div className="header-row">
          <div className="tabs">
            <select
              id="category-select"
              className="category-select"
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
            >
              <option value="all">Tất cả</option>
              {uniqueCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="header-actions">
            <button className="header-btn" onClick={() => setShowVoucherModal(true)}>Quản lý voucher</button>
            <button className="add-btn" onClick={handleAdd}>+ Thêm 1 sản phẩm mới</button>
          </div>
        </div>
        <div className="filter-row">
          <input
            className="search-input"
            placeholder="Tìm tên sản phẩm, SKU..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button className="filter-btn">Áp dụng</button>
        </div>
        <div className="product-table-wrapper">
          <table className="product-table">
            <thead>
              <tr>
                <th></th>
                <th style={{ fontSize: '15px' }}>Tên sản phẩm</th>
                <th style={{ fontSize: '15px', cursor: 'pointer' }} onClick={() => handleSort('price')}>
                  Giá <span style={{ fontSize: '13px' }}>↕</span>
                </th>
                <th style={{ fontSize: '15px', cursor: 'pointer' }} onClick={() => handleSort('stock')}>
                  Kho hàng <span style={{ fontSize: '13px' }}>↕</span>
                </th>
                <th style={{ fontSize: '15px' }}>Áp dụng voucher</th>
                <th style={{ fontSize: '15px' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {sortedProducts.map(product => (
                <tr key={product._id} style={{ fontSize: '15px' }}>
                  <td><input type="checkbox" /></td>
                  <td>
                    <div className="shop-product-info">
                      <img src={product.image_url} alt={product.name} className="shop-product-img larger" />
                      <div>
                        <div className="shop-product-name" style={{ fontSize: '18px', fontWeight: 700 }}>{product.name}</div>
                        {/* Đã xóa SKU và ID */}
                      </div>
                    </div>
                  </td>
                  <td>{product.price?.toLocaleString('vi-VN')} VND</td>
                  <td>{product.stock}</td>
                  <td>
                    {(() => {
                      const voucher = vouchers.find(v => Array.isArray(v.productIds) && v.productIds.includes(product._id));
                      if (voucher) {
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                            <span>{voucher.code}</span>
                            <button
                              style={{ marginTop: 4, fontSize: 13, color: '#e53935', background: 'none', border: '1px solid #e53935', borderRadius: 4, padding: '2px 8px', cursor: 'pointer' }}
                              onClick={() => handleRemoveVoucher(product._id)}
                            >
                              Hủy áp dụng
                            </button>
                          </div>
                        );
                      } else {
                        return <span>Chưa áp dụng</span>;
                      }
                    })()}
                  </td>
                  <td>
                    <div className="action-btn-group">
                      <button className="action-btn" onClick={() => handleEdit(product)}>Cập nhật</button>
                      <button className="action-btn" onClick={() => setDetailProduct(product)}>Xem thêm</button>
                      <button className="action-btn delete-btn" onClick={() => handleDelete(product._id)}>Xóa</button>
                    </div>
                  </td>
                </tr>
              ))}
              {sortedProducts.length === 0 && (
                <tr><td colSpan="7" style={{ textAlign: 'center', color: '#888' }}>Không có sản phẩm</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {showForm && <SellerProduct product={editProduct} onClose={handleFormClose} />}
      {detailProduct && (
        <div className="modal" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: '#0008', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 32, minWidth: 340, maxWidth: 400, boxShadow: '0 2px 16px #0002', position: 'relative' }}>
            <button onClick={() => setDetailProduct(null)} style={{ position: 'absolute', top: 12, right: 18, background: 'none', border: 'none', fontSize: 22, cursor: 'pointer' }}>&times;</button>
            {detailProduct.image_url && (
              <img src={detailProduct.image_url} alt={detailProduct.name} style={{ width: '100%', height: 220, objectFit: 'cover', borderRadius: 8, marginBottom: 16 }} />
            )}
            <div style={{ fontWeight: 700, fontSize: 22, color: '#222', marginBottom: 8 }}>{detailProduct.name}</div>
            <div style={{ fontWeight: 600, color: '#e53935', fontSize: 18, marginBottom: 8 }}>{detailProduct.price?.toLocaleString('vi-VN')} VND</div>
            <div style={{ color: detailProduct.stock === 0 ? '#e53935' : '#666', fontSize: 15, marginBottom: 8 }}>
              {detailProduct.stock === 0 ? 'Hết hàng' : `Tồn kho: ${detailProduct.stock}`}
            </div>
            <div style={{ fontSize: 15, marginBottom: 8 }}><b>Danh mục:</b> {detailProduct.category}</div>
            <div style={{ fontSize: 15, marginBottom: 16 }}><b>Mô tả:</b> {detailProduct.description}</div>
            {/* Đã bỏ nút chỉnh sửa sản phẩm */}
          </div>
        </div>
      )}
      {showDeleteModal && (
        <div className="modal" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: '#0008', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000 }}>
          <div style={{ background: '#fff', borderRadius: 10, padding: 32, minWidth: 320, boxShadow: '0 2px 16px #0002', textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 18 }}>Xác nhận xóa sản phẩm</div>
            <div style={{ marginBottom: 24 }}>Bạn có chắc muốn xóa sản phẩm này?</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
              <button className="action-btn delete-btn" style={{ background: '#e53935', color: '#fff' }} onClick={confirmDelete}>Xóa</button>
              <button className="action-btn" onClick={() => setShowDeleteModal(false)}>Hủy</button>
            </div>
          </div>
        </div>
      )}
      {showVoucherModal && <VoucherManagement onClose={() => setShowVoucherModal(false)} onVoucherApplied={fetchVouchers} />}
    </div>
  );
}

export default ShopManagement;

import React, { useState, useEffect, useCallback } from 'react';
import ProductCatalog from './ProductCatalog';
import ShoppingCart from './ShoppingCart';
import ProductDetail from './ProductDetail';
import './App.css'; // Make sure App.css is imported

// --- Helper function to check for token ---
const isLoggedIn = () => {
  return localStorage.getItem('token') !== null;
};


// --- Become Seller Form Component ---
function BecomeSellerForm({ onSellerSuccess }) {
  const [shopName, setShopName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  // ... you can add more fields for address and bank account here
  const [message, setMessage] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');

    const sellerData = {
      shopName,
      phoneNumber,
      // In a real app, you would collect address and bank details here
      pickupAddress: { street: "123 Test St", ward: "P4", district: "Q4", city: "HCM" },
      bankAccount: { bankName: "TCB", accountHolder: "TEST USER", accountNumber: "123456" }
    };

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/users/become-seller', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(sellerData)
      });

      const responseText = await response.text();
      if (response.ok) {
        setMessage(`Thành công! ${responseText}`);
        onSellerSuccess(); // Notify parent component to refresh profile
      } else {
        setMessage(`Lỗi: ${responseText}`);
      }
    } catch (error) {
      setMessage(`Lỗi mạng: ${error.message}`);
    }
  };

  return (
    <div className="form-container nested-form">
      <h4>Điền thông tin cửa hàng</h4>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="shopName">Tên cửa hàng</label>
          <input type="text" id="shopName" value={shopName} onChange={e => setShopName(e.target.value)} required />
        </div>
        <div className="form-group">
          <label htmlFor="phoneNumber">Số điện thoại</label>
          <input type="text" id="phoneNumber" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} required />
        </div>
        <button type="submit" className="submit-btn">Xác nhận</button>
      </form>
      {message && <p className="message">{message}</p>}
    </div>
  );
}


function Dashboard({ onLogout }) {
  const [userProfile, setUserProfile] = useState(null);
  const [error, setError] = useState('');
  const [showSellerForm, setShowSellerForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editProfileData, setEditProfileData] = useState({
    shopName: '', phoneNumber: '', street: '', ward: '',
    district: '', city: '', bankName: '', accountHolder: '', accountNumber: ''
  });

  const fetchUserProfile = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) { setError('Không tìm thấy token xác thực.'); onLogout(); return; }
      const response = await fetch('http://localhost:8080/api/users/me', { headers: { 'Authorization': `Bearer ${token}` } });
      if (response.ok) {
        const data = await response.json();
        setUserProfile(data);
        setShowSellerForm(false);
        // Pre-fill edit form data if seller profile exists
        if (data.sellerProfile) {
          setEditProfileData({
            shopName: data.sellerProfile.shopName || '',
            phoneNumber: data.sellerProfile.phoneNumber || '',
            street: data.sellerProfile.pickupAddress?.street || '',
            ward: data.sellerProfile.pickupAddress?.ward || '',
            district: data.sellerProfile.pickupAddress?.district || '',
            city: data.sellerProfile.pickupAddress?.city || '',
            bankName: data.sellerProfile.bankAccount?.bankName || '',
            accountHolder: data.sellerProfile.bankAccount?.accountHolder || '',
            accountNumber: data.sellerProfile.bankAccount?.accountNumber || ''
          });
        }
      } else {
        setError('Không thể lấy thông tin người dùng. Vui lòng đăng nhập lại.');
        onLogout();
      }
    } catch (err) {
      setError('Lỗi mạng khi lấy thông tin người dùng.');
    }
  }, [onLogout]);

  useEffect(() => { fetchUserProfile(); }, [fetchUserProfile]);

  const handleEditProfile = () => setIsEditing(true);

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset form data to current profile state
    if (userProfile && userProfile.sellerProfile) {
      setEditProfileData({
        shopName: userProfile.sellerProfile.shopName || '',
        phoneNumber: userProfile.sellerProfile.phoneNumber || '',
        street: userProfile.sellerProfile.pickupAddress?.street || '',
        ward: userProfile.sellerProfile.pickupAddress?.ward || '',
        district: userProfile.sellerProfile.pickupAddress?.district || '',
        city: userProfile.sellerProfile.pickupAddress?.city || '',
        bankName: userProfile.sellerProfile.bankAccount?.bankName || '',
        accountHolder: userProfile.sellerProfile.bankAccount?.accountHolder || '',
        accountNumber: userProfile.sellerProfile.bankAccount?.accountNumber || ''
      });
    }
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditProfileData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSaveProfile = async () => {
    const token = localStorage.getItem('token');
    const updatedData = {
      shopName: editProfileData.shopName,
      phoneNumber: editProfileData.phoneNumber,
      pickupAddress: { street: editProfileData.street, ward: editProfileData.ward, district: editProfileData.district, city: editProfileData.city },
      bankAccount: { bankName: editProfileData.bankName, accountHolder: editProfileData.accountHolder, accountNumber: editProfileData.accountNumber }
    };
    try {
      const response = await fetch('http://localhost:8080/api/users/update-seller-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(updatedData)
      });
      if (response.ok) {
        setIsEditing(false);
        fetchUserProfile();
      } else {
        const errorText = await response.text();
        setError(`Lỗi: ${errorText}`);
      }
    } catch (error) {
      setError(`Lỗi mạng khi lưu thông tin: ${error.message}`);
    }
  };

  if (error) return <div className="dashboard-container"><p className="message">{error}</p></div>;
  if (!userProfile) return <div className="dashboard-container"><p>Đang tải...</p></div>;

  const isSeller = userProfile.roles.includes('ROLE_SELLER');
  const renderAddress = (address, title) => (
      <div className="address-details"><strong>{title}:</strong><p>{address.street}, {address.ward}, {address.district}, {address.city}</p></div>
  );

  return (
    <div className="dashboard-container">
      <h2>Hồ sơ của bạn</h2>
      <div className="profile-section">
          <h4>Thông tin cá nhân</h4>
          <p><strong>Họ và Tên:</strong> {userProfile.fullName}</p>
          <p><strong>Email:</strong> {userProfile.email}</p>
          <p><strong>Vai trò:</strong> {userProfile.roles.join(', ')}</p>
      </div>

      {isSeller && userProfile.sellerProfile && (
        <div className="profile-section">
          <div className="section-header">
            <h3>Hồ sơ Người bán</h3>
            {!isEditing && <button onClick={handleEditProfile} className="edit-btn">Chỉnh sửa</button>}
          </div>
          <p><strong>ID Cửa hàng:</strong> {userProfile.sellerProfile.shopId}</p>
          {isEditing ? (
            <div className="edit-form">
              <div className="form-group"><label>Tên cửa hàng:</label><input type="text" name="shopName" value={editProfileData.shopName} onChange={handleChange} /></div>
              <div className="form-group"><label>Số điện thoại:</label><input type="text" name="phoneNumber" value={editProfileData.phoneNumber} onChange={handleChange} /></div>
              
              <h5>Địa chỉ nhận hàng</h5>
              <div className="form-group"><label>Đường:</label><input type="text" name="street" value={editProfileData.street} onChange={handleChange} /></div>
              <div className="form-group"><label>Phường/Xã:</label><input type="text" name="ward" value={editProfileData.ward} onChange={handleChange} /></div>
              <div className="form-group"><label>Quận/Huyện:</label><input type="text" name="district" value={editProfileData.district} onChange={handleChange} /></div>
              <div className="form-group"><label>Tỉnh/Thành phố:</label><input type="text" name="city" value={editProfileData.city} onChange={handleChange} /></div>
              
              <h5>Tài khoản ngân hàng</h5>
              <div className="form-group"><label>Tên ngân hàng:</label><input type="text" name="bankName" value={editProfileData.bankName} onChange={handleChange} /></div>
              <div className="form-group"><label>Chủ tài khoản:</label><input type="text" name="accountHolder" value={editProfileData.accountHolder} onChange={handleChange} /></div>
              <div className="form-group"><label>Số tài khoản:</label><input type="text" name="accountNumber" value={editProfileData.accountNumber} onChange={handleChange} /></div>
              
              <div className="form-actions">
                <button onClick={handleSaveProfile} className="submit-btn secondary-btn">Lưu thay đổi</button>
                <button onClick={handleCancelEdit} className="submit-btn logout-btn">Hủy</button>
              </div>
            </div>
          ) : (
            <div>
              <p><strong>Tên cửa hàng:</strong> {userProfile.sellerProfile.shopName}</p>
              <p><strong>Số điện thoại:</strong> {userProfile.sellerProfile.phoneNumber}</p>
              {userProfile.sellerProfile.pickupAddress && renderAddress(userProfile.sellerProfile.pickupAddress, "Địa chỉ nhận hàng")}
              {userProfile.sellerProfile.bankAccount && (
                <div className="bank-details"><strong>Thông tin ngân hàng:</strong><p>{userProfile.sellerProfile.bankAccount.bankName} - {userProfile.sellerProfile.bankAccount.accountNumber} (Chủ TK: {userProfile.sellerProfile.bankAccount.accountHolder})</p></div>
              )}
            </div>
          )}
        </div>
      )}

      {!isSeller && !showSellerForm && ( <button onClick={() => setShowSellerForm(true)} className="submit-btn">Trở thành Người bán</button> )}
      {showSellerForm && <BecomeSellerForm onSellerSuccess={fetchUserProfile} />}
      <button onClick={onLogout} className="submit-btn logout-btn">Đăng xuất</button>
    </div>
  );
}



// --- Login Component ---
function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    try {
      const response = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('token', data.token);
        onLoginSuccess(); // Notify parent component that login was successful
      } else {
        setMessage(`Lỗi: ${data.message || 'Sai email hoặc mật khẩu'}`);
      }
    } catch (error) {
      setMessage(`Lỗi: Không thể kết nối đến máy chủ. ${error.message}`);
    }
  };

  return (
    <div className="form-container">
      <h2>Đăng nhập</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="login-email">Email</label>
          <input type="email" id="login-email" value={email} onChange={e => setEmail(e.target.value)} required />
        </div>
        <div className="form-group">
          <label htmlFor="login-password">Mật khẩu</label>
          <input type="password" id="login-password" value={password} onChange={e => setPassword(e.target.value)} required />
        </div>
        <button type="submit" className="submit-btn">Đăng nhập</button>
      </form>
      {message && <p className="message">{message}</p>}
    </div>
  );
}

// --- SignUp Component (Unchanged from before) ---
function SignUp() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    try {
      const response = await fetch('http://localhost:8080/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, password }),
      });
      const responseText = await response.text();
      if (response.ok) {
        setMessage(`Thành công: ${responseText}`);
        setFullName(''); setEmail(''); setPassword('');
      } else {
        setMessage(`Lỗi: ${responseText}`);
      }
    } catch (error) {
      setMessage(`Lỗi: Không thể kết nối đến máy chủ. ${error.message}`);
    }
  };

  return (
    <div className="form-container">
      <h2>Tạo tài khoản</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="fullName">Họ và Tên</label>
          <input type="text" id="fullName" value={fullName} onChange={e => setFullName(e.target.value)} required />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} required />
        </div>
        <div className="form-group">
          <label htmlFor="password">Mật khẩu</label>
          <input type="password" id="password" value={password} onChange={e => setPassword(e.target.value)} required />
        </div>
        <button type="submit" className="submit-btn">Đăng ký</button>
      </form>
      {message && <p className="message">{message}</p>}
    </div>
  );
}

// --- Main App Component ---
function App() {
  const [isLoggedInUser, setIsLoggedInUser] = useState(isLoggedIn());
  const [currentView, setCurrentView] = useState('catalog'); // 'catalog', 'cart', 'detail', 'dashboard'
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [message, setMessage] = useState('');
  const [messageTimeoutId, setMessageTimeoutId] = useState(null); // New state for timeout ID
  const [cartItems, setCartItems] = useState([]);

  const displayMessage = (msg, duration = 3000) => {
    // Clear any existing timeout
    if (messageTimeoutId) {
      clearTimeout(messageTimeoutId);
    }
    setMessage(msg);
    const id = setTimeout(() => {
      setMessage('');
      setMessageTimeoutId(null);
    }, duration);
    setMessageTimeoutId(id);
  };

  useEffect(() => {
    if (isLoggedInUser && currentView === 'cart') {
      fetchCartProducts();
    }
  }, [isLoggedInUser, currentView]);

  const handleLoginSuccess = () => {
    setIsLoggedInUser(true);
    setCurrentView('catalog'); // Navigate to catalog after login
    displayMessage('Đăng nhập thành công!'); // Use displayMessage
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedInUser(false);
    setCurrentView('login'); // Navigate to login after logout
    displayMessage('Bạn đã đăng xuất.'); // Use displayMessage
  };

  const fetchCartProducts = async () => {
    if (!isLoggedInUser) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/customers/cart', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCartItems(data);
      } else {
        const errorText = await response.text();
        displayMessage(`Error fetching cart: ${errorText}`, 5000);
      }
    } catch (error) {
      displayMessage(`Network error fetching cart: ${error.message}`, 5000);
    }
  };

  const handleAddToCart = async (productId, quantity) => {
    if (!isLoggedInUser) {
      displayMessage('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.', 5000);
      setCurrentView('login'); // Redirect to login if not logged in
      return false; // Indicate failure
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/customers/cart/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ productId, quantity })
      });

      if (response.ok) {
        displayMessage('Sản phẩm đã được thêm vào giỏ hàng!'); // Use displayMessage
        fetchCartProducts(); // Refresh cart after adding
        return true; // Indicate success
      } else {
        const errorText = await response.text();
        displayMessage(`Lỗi thêm vào giỏ hàng: ${errorText}`, 5000);
        return false; // Indicate failure
      }
    } catch (error) {
      displayMessage(`Lỗi mạng khi thêm vào giỏ hàng: ${error.message}`, 5000);
      return false; // Indicate failure
    }
  };

  const handleProductView = (productId) => {
    setSelectedProductId(productId);
    setCurrentView('detail');
    displayMessage('', 0); // Clear any existing messages instantly
  };

  const handleBackToCatalog = () => {
    setSelectedProductId(null);
    setCurrentView('catalog');
    displayMessage('', 0); // Clear any existing messages instantly
  };

  const handlePlaceOrder = (orderId) => {
    displayMessage(`Đơn hàng của bạn đã được đặt thành công! Mã đơn hàng: ${orderId}`); // Use displayMessage
    // Cart items are cleared by ShoppingCart component, so no need to clear again here.
    setCurrentView('catalog'); // Navigate to catalog after order
  };

  const handleUpdateCartQuantity = async (productId, quantity) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/customers/cart/update-quantity/${productId}/${quantity}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        fetchCartProducts();
        displayMessage('Số lượng sản phẩm đã được cập nhật.'); // Use displayMessage
      } else {
        const errorText = await response.text();
        displayMessage(`Error updating quantity: ${errorText}`, 5000);
      }
    } catch (error) {
      displayMessage(`Network error updating quantity: ${error.message}`, 5000);
    }
  };

  const handleRemoveFromCart = async (productId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/customers/cart/remove/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        fetchCartProducts();
        displayMessage('Sản phẩm đã được xóa khỏi giỏ hàng.'); // Use displayMessage
      } else {
        const errorText = await response.text();
        displayMessage(`Error removing from cart: ${errorText}`, 5000);
      }
    } catch (error) {
      displayMessage(`Lỗi mạng khi xóa khỏi giỏ hàng: ${error.message}`, 5000);
    }
  };

  let content;
  if (!isLoggedInUser) {
    switch (currentView) {
      case 'login':
        content = <Login onLoginSuccess={handleLoginSuccess} />;
        break;
      case 'signup':
        content = <SignUp />;
        break;
      default:
        content = <Login onLoginSuccess={handleLoginSuccess} />;
    }
  } else {
    switch (currentView) {
      case 'catalog':
        content = <ProductCatalog onAddToCart={handleAddToCart} onProductView={handleProductView} />;
        break;
      case 'cart':
        content = <ShoppingCart
          cartItems={cartItems}
          onUpdateQuantity={handleUpdateCartQuantity}
          onRemoveFromCart={handleRemoveFromCart}
          onPlaceOrder={handlePlaceOrder}
        />;
        break;
      case 'detail':
        content = selectedProductId ? (
          <ProductDetail
            productId={selectedProductId}
            onBack={handleBackToCatalog}
            onAddToCart={handleAddToCart}
          />
        ) : (
          <div className="error-message">Không tìm thấy thông tin sản phẩm</div>
        );
        break;
      case 'dashboard':
        content = <Dashboard onLogout={handleLogout} />;
        break;
      default:
        content = <ProductCatalog onAddToCart={handleAddToCart} onProductView={handleProductView} />;
    }
  }

  return (
    <div className="App">
      <header className="App-header">
        <div className="logo">SHOPEE</div>
        <nav>
          {isLoggedInUser ? (
            <>
              <button onClick={() => setCurrentView('catalog')}>Sản phẩm</button>
              <button onClick={() => setCurrentView('cart')}>Giỏ hàng</button>
              <button onClick={() => setCurrentView('dashboard')}>Bảng điều khiển</button>
              <button onClick={handleLogout} className="logout-btn">Đăng xuất</button>
            </>
          ) : (
            <>
              <button onClick={() => setCurrentView('login')}>Đăng nhập</button>
              <button onClick={() => setCurrentView('signup')}>Đăng ký</button>
              <button onClick={() => setCurrentView('catalog')}>Sản phẩm</button>
            </>
          )}
        </nav>
      </header>

      <main>
        {message && <p className="message">{message}</p>}
        {content}
      </main>
    </div>
  );
}

export default App;

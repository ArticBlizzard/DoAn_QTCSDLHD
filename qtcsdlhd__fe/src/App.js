import React, { useState, useEffect, useCallback } from 'react';
import ProductCatalog from './ProductCatalog';
import ShoppingCart from './ShoppingCart';
import ProductDetail from './ProductDetail';
import ShopManagement from './ShopManagement';
import './App.css'; // Make sure App.css is imported

// --- Helper function to check for token ---
const isLoggedIn = () => {
  return localStorage.getItem('token') !== null;
};


// --- Become Seller Form Component ---
function BecomeSellerForm({ onSellerSuccess }) {
  // State cho thông tin cơ bản
  const [shopName, setShopName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [businessType, setBusinessType] = useState('INDIVIDUAL');
  
  // State cho địa chỉ (các trường đều trống)
  const [street, setStreet] = useState('');
  const [ward, setWard] = useState('');
  const [district, setDistrict] = useState('');
  const [city, setCity] = useState('');

  // State cho tài khoản ngân hàng (các trường đều trống)
  const [bankName, setBankName] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [accountNumber, setAccountNumber] = useState('');

  const [message, setMessage] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');

    // Dựng lại đối tượng sellerData từ state của form
    const sellerData = {
      shopName,
      phoneNumber,
      businessType,
      pickupAddress: { street, ward, district, city },
      bankAccount: { bankName, accountHolder, accountNumber }
    };

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/users/become-seller', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(sellerData)
      });
      const responseText = await response.text();
      if (response.ok) {
        setMessage(`Thành công! ${responseText}`);
        onSellerSuccess();
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
        {/* Shop Info */}
        <div className="form-group"><label htmlFor="shopName">Tên cửa hàng</label><input type="text" id="shopName" value={shopName} onChange={e => setShopName(e.target.value)} required /></div>
        <div className="form-group"><label htmlFor="phoneNumber">Số điện thoại Shop</label><input type="text" id="phoneNumber" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} required /></div>
        <div className="form-group"><label htmlFor="businessType">Loại hình kinh doanh</label><select id="businessType" value={businessType} onChange={e => setBusinessType(e.target.value)}><option value="INDIVIDUAL">Cá nhân</option><option value="COMPANY">Doanh nghiệp</option></select></div>
        
        {/* Address Info */}
        <h5>Địa chỉ lấy hàng</h5>
        <div className="form-group"><label htmlFor="street">Đường</label><input type="text" id="street" value={street} onChange={e => setStreet(e.target.value)} required /></div>
        <div className="form-group"><label htmlFor="ward">Phường/Xã</label><input type="text" id="ward" value={ward} onChange={e => setWard(e.target.value)} required /></div>
        <div className="form-group"><label htmlFor="district">Quận/Huyện</label><input type="text" id="district" value={district} onChange={e => setDistrict(e.target.value)} required /></div>
        <div className="form-group"><label htmlFor="city">Tỉnh/Thành phố</label><input type="text" id="city" value={city} onChange={e => setCity(e.target.value)} required /></div>

        {/* Bank Info */}
        <h5>Tài khoản ngân hàng</h5>
        <div className="form-group"><label htmlFor="bankName">Tên ngân hàng</label><input type="text" id="bankName" value={bankName} onChange={e => setBankName(e.target.value)} required /></div>
        <div className="form-group"><label htmlFor="accountHolder">Tên chủ tài khoản</label><input type="text" id="accountHolder" value={accountHolder} onChange={e => setAccountHolder(e.target.value)} required /></div>
        <div className="form-group"><label htmlFor="accountNumber">Số tài khoản</label><input type="text" id="accountNumber" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} required /></div>

        <button type="submit" className="submit-btn secondary-btn">Xác nhận</button>
      </form>
      {message && <p className="message">{message}</p>}
    </div>
  );
}


function Dashboard({ onLogout }) {
    const [userProfile, setUserProfile] = useState(null);
    const [error, setError] = useState('');
    const [showSellerForm, setShowSellerForm] = useState(false);
    
    const [isEditingBuyer, setIsEditingBuyer] = useState(false);
    const [buyerEditData, setBuyerEditData] = useState({ phoneNumber: '', primaryAddress: { street: '', ward: '', district: '', city: '' }, bankAccount: { bankName: '', accountHolder: '', accountNumber: '' }});
    
    const [isEditingSeller, setIsEditingSeller] = useState(false);
    const [sellerEditData, setSellerEditData] = useState({ shopName: '', phoneNumber: '', pickupAddress: { street: '', ward: '', district: '', city: '' }, bankAccount: { bankName: '', accountHolder: '', accountNumber: '' }});

    const prefillForms = (data) => {
        // Kiểm tra an toàn cho buyerProfile
        if (data.buyerProfile) {
            setBuyerEditData({
                phoneNumber: data.buyerProfile.phoneNumber || '',
                primaryAddress: data.buyerProfile.primaryAddress || { street: '', ward: '', district: '', city: '' },
                bankAccount: data.buyerProfile.bankAccount || { bankName: '', accountHolder: '', accountNumber: '' }
            });
        }
        // --- SỬA LỖI TẠI ĐÂY ---
        // Chỉ điền thông tin nếu sellerProfile tồn tại
        if (data.sellerProfile) {
            setSellerEditData({
                shopName: data.sellerProfile.shopName || '',
                phoneNumber: data.sellerProfile.phoneNumber || '',
                // Sử dụng optional chaining (?.) để truy cập an toàn
                pickupAddress: data.sellerProfile.pickupAddress || { street: '', ward: '', district: '', city: '' },
                bankAccount: data.sellerProfile.bankAccount || { bankName: '', accountHolder: '', accountNumber: '' }
            });
        }
    };

    const fetchUserProfile = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) { setError('Không tìm thấy token.'); onLogout(); return; }
            const response = await fetch('http://localhost:8080/api/users/me', { headers: { 'Authorization': `Bearer ${token}` } });
            if (response.ok) {
                const data = await response.json();
                setUserProfile(data);
                setShowSellerForm(false);
                prefillForms(data);
            } else { setError('Không thể lấy thông tin. Vui lòng đăng nhập lại.'); onLogout(); }
        } catch (err) { setError('Lỗi mạng khi lấy thông tin người dùng.'); }
    }, [onLogout]);

    useEffect(() => { fetchUserProfile(); }, [fetchUserProfile]);
    
    const handleBuyerChange = (e, section) => {
        const { name, value } = e.target;
        if (section) {
            setBuyerEditData(prev => ({...prev, [section]: { ...prev[section], [name]: value }}));
        } else {
            setBuyerEditData(prev => ({ ...prev, [name]: value }));
        }
    };
    const handleSaveBuyerProfile = async () => {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch('http://localhost:8080/api/users/update-buyer-profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(buyerEditData)
            });
            if(response.ok) { setIsEditingBuyer(false); fetchUserProfile(); }
            else { setError(`Lỗi: ${await response.text()}`); }
        } catch(err) { setError(`Lỗi mạng: ${err.message}`); }
    };
    
    // Thêm các handler cho việc chỉnh sửa thông tin người bán
    const handleSellerChange = (e, section) => {
        const { name, value } = e.target;
        if (section) {
            setSellerEditData(prev => ({...prev, [section]: { ...prev[section], [name]: value }}));
        } else {
            setSellerEditData(prev => ({...prev, [name]: value }));
        }
    };
    const handleSaveSellerProfile = async () => {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch('http://localhost:8080/api/users/update-seller-profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(sellerEditData)
            });
            if (response.ok) { setIsEditingSeller(false); fetchUserProfile(); }
            else { setError(`Lỗi: ${await response.text()}`); }
        } catch (error) { setError(`Lỗi mạng khi lưu thông tin: ${error.message}`); }
    };

    if (error) return <div className="dashboard-container"><p className="message">{error}</p></div>;
    if (!userProfile) return <div className="dashboard-container"><p>Đang tải...</p></div>;

    const isSeller = userProfile.roles.includes('ROLE_SELLER');

    return (
        <div className="dashboard-container">
            <h2>Hồ sơ của bạn</h2>
            <div className="profile-section">
                <h4>Thông tin cá nhân</h4>
                <p><strong>Họ và Tên:</strong> {userProfile.fullName}</p>
                <p><strong>Email:</strong> {userProfile.email}</p>
                <p><strong>Vai trò:</strong> {userProfile.roles.join(', ')}</p>
            </div>
            
            <div className="profile-section">
                <div className="section-header">
                    <h4>Thông tin Người mua</h4>
                    {!isEditingBuyer && <button onClick={() => setIsEditingBuyer(true)} className="edit-btn">Chỉnh sửa</button>}
                </div>
                {isEditingBuyer ? (
                    <div className="edit-form">
                        <div className="form-group"><label>Số điện thoại:</label><input type="text" name="phoneNumber" value={buyerEditData.phoneNumber} onChange={(e) => handleBuyerChange(e)} /></div>
                        <h5>Địa chỉ chính</h5>
                        <div className="form-group"><label>Đường:</label><input type="text" name="street" value={buyerEditData.primaryAddress.street} onChange={(e) => handleBuyerChange(e, 'primaryAddress')} /></div>
                        <div className="form-group"><label>Phường/Xã:</label><input type="text" name="ward" value={buyerEditData.primaryAddress.ward} onChange={(e) => handleBuyerChange(e, 'primaryAddress')} /></div>
                        <div className="form-group"><label>Quận/Huyện:</label><input type="text" name="district" value={buyerEditData.primaryAddress.district} onChange={(e) => handleBuyerChange(e, 'primaryAddress')} /></div>
                        <div className="form-group"><label>Tỉnh/Thành phố:</label><input type="text" name="city" value={buyerEditData.primaryAddress.city} onChange={(e) => handleBuyerChange(e, 'primaryAddress')} /></div>
                        <h5>Tài khoản ngân hàng</h5>
                        <div className="form-group"><label>Tên ngân hàng:</label><input type="text" name="bankName" value={buyerEditData.bankAccount.bankName} onChange={(e) => handleBuyerChange(e, 'bankAccount')} /></div>
                        <div className="form-group"><label>Chủ tài khoản:</label><input type="text" name="accountHolder" value={buyerEditData.bankAccount.accountHolder} onChange={(e) => handleBuyerChange(e, 'bankAccount')} /></div>
                        <div className="form-group"><label>Số tài khoản:</label><input type="text" name="accountNumber" value={buyerEditData.bankAccount.accountNumber} onChange={(e) => handleBuyerChange(e, 'bankAccount')} /></div>
                        <div className="form-actions">
                            <button onClick={handleSaveBuyerProfile} className="submit-btn secondary-btn">Lưu</button>
                            <button onClick={() => setIsEditingBuyer(false)} className="submit-btn logout-btn">Hủy</button>
                        </div>
                    </div>
                ) : (
                    <>
                        <p><strong>Số điện thoại:</strong> {userProfile.buyerProfile?.phoneNumber || "Chưa cập nhật"}</p>
                        {userProfile.buyerProfile?.primaryAddress && userProfile.buyerProfile.primaryAddress.street ? 
                            <p><strong>Địa chỉ chính:</strong> {`${userProfile.buyerProfile.primaryAddress.street}, ${userProfile.buyerProfile.primaryAddress.ward}, ${userProfile.buyerProfile.primaryAddress.district}, ${userProfile.buyerProfile.primaryAddress.city}`}</p> : 
                            <p><strong>Địa chỉ chính:</strong> Chưa cập nhật</p>}
                        {userProfile.buyerProfile?.bankAccount && userProfile.buyerProfile.bankAccount.bankName ? 
                            <p><strong>Ngân hàng:</strong> {`${userProfile.buyerProfile.bankAccount.bankName} - ${userProfile.buyerProfile.bankAccount.accountNumber}`}</p> : 
                            <p><strong>Ngân hàng:</strong> Chưa cập nhật</p>}
                    </>
                )}
            </div>

            {isSeller && (
                <div className="profile-section">
                    <div className="section-header">
                        <h3>Hồ sơ Người bán</h3>
                        {!isEditingSeller && <button onClick={() => setIsEditingSeller(true)} className="edit-btn">Chỉnh sửa</button>}
                    </div>
                    {isEditingSeller ? (
                         <div className="edit-form">
                            <div className="form-group"><label>Tên cửa hàng:</label><input type="text" name="shopName" value={sellerEditData.shopName} onChange={(e) => handleSellerChange(e)} /></div>
                            <div className="form-group"><label>Số điện thoại:</label><input type="text" name="phoneNumber" value={sellerEditData.phoneNumber} onChange={(e) => handleSellerChange(e)} /></div>
                            <h5>Địa chỉ nhận hàng</h5>
                            <div className="form-group"><label>Đường:</label><input type="text" name="street" value={sellerEditData.pickupAddress.street} onChange={(e) => handleSellerChange(e, 'pickupAddress')} /></div>
                            <div className="form-group"><label>Phường/Xã:</label><input type="text" name="ward" value={sellerEditData.pickupAddress.ward} onChange={(e) => handleSellerChange(e, 'pickupAddress')} /></div>
                            <div className="form-group"><label>Quận/Huyện:</label><input type="text" name="district" value={sellerEditData.pickupAddress.district} onChange={(e) => handleSellerChange(e, 'pickupAddress')} /></div>
                            <div className="form-group"><label>Tỉnh/Thành phố:</label><input type="text" name="city" value={sellerEditData.pickupAddress.city} onChange={(e) => handleSellerChange(e, 'pickupAddress')} /></div>
                            <h5>Tài khoản ngân hàng</h5>
                            <div className="form-group"><label>Tên ngân hàng:</label><input type="text" name="bankName" value={sellerEditData.bankAccount.bankName} onChange={(e) => handleSellerChange(e, 'bankAccount')} /></div>
                            <div className="form-group"><label>Chủ tài khoản:</label><input type="text" name="accountHolder" value={sellerEditData.bankAccount.accountHolder} onChange={(e) => handleSellerChange(e, 'bankAccount')} /></div>
                            <div className="form-group"><label>Số tài khoản:</label><input type="text" name="accountNumber" value={sellerEditData.bankAccount.accountNumber} onChange={(e) => handleSellerChange(e, 'bankAccount')} /></div>
                            <div className="form-actions">
                                <button onClick={handleSaveSellerProfile} className="submit-btn secondary-btn">Lưu thay đổi</button>
                                <button onClick={() => setIsEditingSeller(false)} className="submit-btn logout-btn">Hủy</button>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <p><strong>ID Cửa hàng:</strong> {userProfile.sellerProfile?.shopId}</p>
                            <p><strong>Tên cửa hàng:</strong> {userProfile.sellerProfile?.shopName}</p>
                            <p><strong>Số điện thoại:</strong> {userProfile.sellerProfile?.phoneNumber}</p>
                            {userProfile.sellerProfile?.pickupAddress && <p><strong>Địa chỉ nhận hàng:</strong> {`${userProfile.sellerProfile.pickupAddress.street}, ${userProfile.sellerProfile.pickupAddress.ward}, ${userProfile.sellerProfile.pickupAddress.district}, ${userProfile.sellerProfile.pickupAddress.city}`}</p>}
                            {userProfile.sellerProfile?.bankAccount && <p><strong>Tài khoản ngân hàng:</strong> {`${userProfile.sellerProfile.bankAccount.bankName} - ${userProfile.sellerProfile.bankAccount.accountHolder}`}</p>}
                        </div>
                    )}
                </div>
            )}

            {!isSeller && !showSellerForm && (<button onClick={() => setShowSellerForm(true)} className="submit-btn">Trở thành Người bán</button>)}
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
      case 'shop-management':
        content = <ShopManagement />;
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
              <button onClick={() => setCurrentView('shop-management')}>Quản lý sản phẩm</button>
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

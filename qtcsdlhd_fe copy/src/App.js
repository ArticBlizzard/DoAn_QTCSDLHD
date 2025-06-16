import React, { useState, useEffect } from 'react';
import SellerProductList from './SellerProductList';

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
        <button type="submit" className="submit-btn secondary-btn">Xác nhận</button>
      </form>
      {message && <p className="message">{message}</p>}
    </div>
  );
}


// --- User Dashboard Component ---
function Dashboard({ onLogout, onShowProductList }) {
  const [userProfile, setUserProfile] = useState(null);
  const [error, setError] = useState('');
  const [showSellerForm, setShowSellerForm] = useState(false);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Không tìm thấy token xác thực.');
        onLogout(); // Log out if no token
        return;
      }

      const response = await fetch('http://localhost:8080/api/users/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUserProfile(data);
        setShowSellerForm(false); // Hide form after successful profile fetch
      } else {
        // Handle cases like expired token
        setError('Không thể lấy thông tin người dùng. Vui lòng đăng nhập lại.');
        onLogout();
      }
    } catch (err) {
      setError('Lỗi mạng khi lấy thông tin người dùng.');
    }
  };

  // useEffect hook to fetch data when the component loads
  useEffect(() => {
    fetchUserProfile();
  }, []); // The empty array [] means this effect runs only once

  const handleBecomeSellerClick = () => {
    setShowSellerForm(true);
  };

  if (error) {
    return <div className="dashboard-container"><p className="message">{error}</p></div>;
  }

  if (!userProfile) {
    return <div className="dashboard-container"><p>Đang tải thông tin...</p></div>;
  }

  const isSeller = userProfile.roles.includes('ROLE_SELLER');

  return (
    <div className="dashboard-container">
      <h2>Trang của bạn</h2>
      <p><strong>Email:</strong> {userProfile.email}</p>
      <p><strong>Họ và Tên:</strong> {userProfile.fullName}</p>
      <p><strong>Vai trò:</strong> {userProfile.roles.join(', ')}</p>
      {isSeller && userProfile.sellerProfile && (
        <div className="profile-section">
          <h3>Hồ sơ Người bán</h3>
          <p><strong>Tên cửa hàng:</strong> {userProfile.sellerProfile.shopName}</p>
        </div>
      )}
      {!isSeller && !showSellerForm && (
        <button onClick={handleBecomeSellerClick} className="submit-btn">Trở thành Người bán</button>
      )}
      {showSellerForm && <BecomeSellerForm onSellerSuccess={fetchUserProfile} />}
      {isSeller && (
        <button className="add-btn" onClick={onShowProductList}>
          Xem danh mục sản phẩm
        </button>
      )}
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
  // This state now controls what the user sees
  const [auth, setAuth] = useState(isLoggedIn());
  const [showProductList, setShowProductList] = useState(false);

  const handleLoginSuccess = () => {
    setAuth(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setAuth(false);
  };

  return (
    <div className="App">
      <header className="App-header">
        {showProductList ? (
          <div style={{position:'relative', display:'flex', alignItems:'center', justifyContent:'center'}}>
            <button className="back-btn" onClick={() => setShowProductList(false)} style={{position:'absolute', left:0}}>
              Quay lại trang chính
            </button>
            <h1 style={{margin:0, textAlign:'center', width:'100%'}}>Danh mục sản phẩm</h1>
          </div>
        ) : (
          <h1>Chào mừng đến với Cửa hàng</h1>
        )}
      </header>
      <main className="main-layout">
        {showProductList ? (
          <SellerProductList />
        ) : auth ? (
          <Dashboard onLogout={handleLogout} onShowProductList={() => setShowProductList(true)} />
        ) : (
          <>
            <SignUp />
            <Login onLoginSuccess={handleLoginSuccess} />
          </>
        )}
      </main>
    </div>
  );
}


// --- Styles ---
const styles = `
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f7f6; margin: 0; padding: 20px; }
.App { text-align: center; width: 100%; }
.App-header { background-color: #ffffff; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 40px; border-radius: 8px; }
.main-layout { display: flex; justify-content: center; gap: 40px; flex-wrap: wrap; }
.form-container, .dashboard-container { background: #ffffff; padding: 40px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); width: 100%; max-width: 480px; margin: 0; text-align: left; }
.dashboard-container p { margin: 10px 0; }
.profile-section { margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; }
.nested-form { margin-top: 20px; padding: 20px; box-shadow: none; border: 1px solid #eee; }
h2, h3, h4 { margin-top: 0; margin-bottom: 20px; color: #333; }
.form-group { margin-bottom: 20px; text-align: left; }
.form-group label { display: block; margin-bottom: 5px; color: #666; font-weight: bold; }
.form-group input { width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; }
.submit-btn { width: 100%; padding: 12px; border: none; border-radius: 4px; background-color: #007bff; color: white; font-size: 16px; cursor: pointer; transition: background-color 0.3s; margin-top: 10px; }
.submit-btn:hover { background-color: #0056b3; }
.secondary-btn { background-color: #28a745; }
.secondary-btn:hover { background-color: #218838; }
.logout-btn { background-color: #dc3545; margin-top: 20px; }
.logout-btn:hover { background-color: #c82333; }
.message { margin-top: 20px; padding: 10px; border-radius: 4px; color: #333; background-color: #e9ecef; word-wrap: break-word; }
`;
if (!document.getElementById('app-styles')) {
  const styleSheet = document.createElement("style");
  styleSheet.id = 'app-styles';
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}

export default App;

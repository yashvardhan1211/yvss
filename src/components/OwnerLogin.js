import React, { useState } from 'react';
import './OwnerLogin.css';

const OwnerLogin = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    salonName: ''
  });
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate login/register
    setTimeout(() => {
      const ownerData = {
        id: 'owner_123',
        name: formData.salonName || 'Beauty Palace',
        email: formData.email,
        salonId: 'salon_123'
      };
      onLogin(ownerData);
      setLoading(false);
    }, 1000);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="owner-login">
      <div className="login-container">
        <div className="login-header">
          <h1>💼 Salon Owner Portal</h1>
          <p>{isRegister ? 'Register your salon' : 'Manage your salon queue'}</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {isRegister && (
            <div className="form-group">
              <label>Salon Name</label>
              <input
                type="text"
                name="salonName"
                value={formData.salonName}
                onChange={handleChange}
                placeholder="Enter your salon name"
                required
              />
            </div>
          )}

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
            />
          </div>

          <button type="submit" disabled={loading} className="login-btn">
            {loading ? (
              <>
                <div className="spinner small"></div>
                {isRegister ? 'Registering...' : 'Logging in...'}
              </>
            ) : (
              isRegister ? 'Register Salon' : 'Login to Dashboard'
            )}
          </button>
        </form>

        <div className="login-footer">
          <p>
            {isRegister ? 'Already have an account?' : "Don't have an account?"}
            <button 
              onClick={() => setIsRegister(!isRegister)}
              className="toggle-btn"
            >
              {isRegister ? 'Login' : 'Register'}
            </button>
          </p>
        </div>

        <div className="back-to-customer">
          <a href="/">← Back to Customer App</a>
        </div>
      </div>
    </div>
  );
};

export default OwnerLogin;
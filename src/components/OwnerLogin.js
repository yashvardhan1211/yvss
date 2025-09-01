import React, { useState, useEffect } from 'react';
import './OwnerLogin.css';
import razorpayService from '../services/razorpayService';

const OwnerLogin = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    salonName: '',
    phone: '',
    address: '',
    otp: ''
  });
  const [isRegister, setIsRegister] = useState(false);
  const [registrationType, setRegistrationType] = useState(''); // 'google-maps' or 'direct'
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState({
    shopImages: [],
    documents: []
  });
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  useEffect(() => {
    // Check if Razorpay is loaded
    const checkRazorpay = () => {
      if (window.Razorpay) {
        setRazorpayLoaded(true);
        console.log('Razorpay SDK loaded successfully');
      } else {
        console.log('Razorpay SDK not loaded yet');
        // Try again after a short delay
        setTimeout(checkRazorpay, 1000);
      }
    };

    checkRazorpay();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    if (isRegister && registrationType === 'google-maps' && !otpSent) {
      // Send OTP for Google Maps verification (Demo)
      setTimeout(() => {
        setOtpSent(true);
        setLoading(false);
        alert('🚀 DEMO MODE: OTP sent to your email!\n\nFor testing, use OTP: 123456\n\n(In production, this will send a real OTP to your email)');
      }, 1000);
      return;
    }
    
    if (isRegister && registrationType === 'google-maps' && otpSent) {
      // Verify OTP (Demo - accepts 123456)
      if (formData.otp !== '123456') {
        setLoading(false);
        alert('❌ Invalid OTP! For demo, use: 123456');
        return;
      }
    }
    
    // Simulate login/register
    setTimeout(() => {
      const ownerData = {
        id: 'owner_123',
        name: formData.salonName || 'Beauty Palace',
        email: formData.email,
        salonId: 'salon_123',
        registrationType: registrationType
      };
      onLogin(ownerData);
      setLoading(false);
    }, 1000);
  };

  const handleFileUpload = (type, files) => {
    setUploadedFiles(prev => ({
      ...prev,
      [type]: [...prev[type], ...Array.from(files)]
    }));
  };

  const removeFile = (type, index) => {
    setUploadedFiles(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));
  };

  const handleRegistrationTypeSelect = (type) => {
    setRegistrationType(type);
    setCurrentStep(2);
  };

  const handlePayment = async () => {
    // Validate required fields before payment
    if (!formData.salonName || !formData.email || !formData.phone || !formData.address || !formData.password) {
      alert('Please fill all required fields before proceeding to payment.');
      return;
    }

    if (uploadedFiles.shopImages.length < 3) {
      alert('Please upload at least 3 shop images before proceeding to payment.');
      return;
    }

    if (uploadedFiles.documents.length === 0) {
      alert('Please upload at least one business document before proceeding to payment.');
      return;
    }

    setLoading(true);

    // Check if Razorpay is loaded
    if (!window.Razorpay) {
      console.error('Razorpay SDK not loaded');
      setLoading(false);
      alert('🚀 DEMO MODE: Razorpay SDK not loaded\n\n' +
            'In production, this will open Razorpay checkout for ₹100 payment.\n\n' +
            'Proceeding with demo registration...');
      setTimeout(() => {
        setCurrentStep(3);
      }, 1000);
      return;
    }

    try {
      // Razorpay checkout options
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID || 'rzp_test_1DP5mmOlF5G5ag',
        amount: 10000, // ₹100 in paise
        currency: 'INR',
        name: 'Salon Finder',
        description: 'Salon Registration Fee - ₹100',
        image: '/logo192.png',
        prefill: {
          name: formData.salonName,
          email: formData.email,
          contact: formData.phone,
        },
        notes: {
          address: formData.address,
          salonName: formData.salonName,
          registrationType: 'direct'
        },
        theme: {
          color: '#007aff'
        },
        handler: function (response) {
          // Payment successful
          console.log('Payment successful:', response);
          setLoading(false);
          setCurrentStep(3);
          
          // Store payment details for verification
          localStorage.setItem('salonPayment', JSON.stringify({
            paymentId: response.razorpay_payment_id,
            orderId: response.razorpay_order_id,
            signature: response.razorpay_signature,
            salonData: formData,
            timestamp: new Date().toISOString()
          }));
          
          console.log('Payment details stored for backend verification');
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
            console.log('Payment modal closed by user');
          }
        }
      };

      // Create and open Razorpay checkout
      const rzp = new window.Razorpay(options);
      
      rzp.on('payment.failed', function (response) {
        setLoading(false);
        console.error('Payment failed:', response.error);
        alert(`Payment failed: ${response.error.description}`);
      });

      rzp.open();

    } catch (error) {
      console.error('Payment initialization error:', error);
      setLoading(false);
      alert('Failed to initialize payment. Please try again.');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const renderRegistrationOptions = () => (
    <div className="registration-options">
      <h2>Choose Registration Type</h2>
      <p>Select how you'd like to register your salon</p>
      
      <div className="option-cards">
        <div className="option-card" onClick={() => handleRegistrationTypeSelect('google-maps')}>
          <div className="option-icon">🗺️</div>
          <h3>Already on Google Maps</h3>
          <p>Verify your existing Google Maps listing</p>
          <ul>
            <li>✅ Quick verification process</li>
            <li>✅ Upload verification documents</li>
            <li>✅ OTP verification</li>
            <li>✅ Free registration</li>
          </ul>
          <button className="option-btn primary">Verify Existing Listing</button>
        </div>

        <div className="option-card" onClick={() => handleRegistrationTypeSelect('direct')}>
          <div className="option-icon">🏪</div>
          <h3>Register Directly Here</h3>
          <p>Complete registration with our assistance</p>
          <ul>
            <li>📞 Call from our agent</li>
            <li>📸 Upload shop images</li>
            <li>📄 Upload required documents</li>
            <li>💰 ₹100 registration fee</li>
          </ul>
          <button className="option-btn secondary">Register New Salon</button>
        </div>
      </div>
    </div>
  );

  const renderGoogleMapsForm = () => (
    <form onSubmit={handleSubmit} className="registration-form">
      <div className="form-header">
        <h2>🗺️ Verify Google Maps Listing</h2>
        <p>Enter your salon details to verify your existing Google Maps listing</p>
      </div>

      <div className="form-group">
        <label>Salon Name *</label>
        <input
          type="text"
          name="salonName"
          value={formData.salonName}
          onChange={handleChange}
          placeholder="Enter your salon name as on Google Maps"
          required
        />
      </div>

      <div className="form-group">
        <label>Email Address *</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Enter your business email"
          required
        />
      </div>

      <div className="form-group">
        <label>Phone Number *</label>
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          placeholder="Enter your business phone"
          required
        />
      </div>

      <div className="form-group">
        <label>Business Address *</label>
        <textarea
          name="address"
          value={formData.address}
          onChange={handleChange}
          placeholder="Enter your complete business address"
          required
        />
      </div>

      <div className="form-group">
        <label>Password *</label>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Create a strong password"
          required
        />
      </div>

      <div className="form-group">
        <label>Upload Verification Documents *</label>
        <div className="file-upload-area">
          <input
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => handleFileUpload('documents', e.target.files)}
            className="file-input"
          />
          <div className="upload-text">
            <p>📄 Upload business license, GST certificate, or other verification documents</p>
            <small>Supported: PDF, JPG, PNG (Max 5MB each)</small>
          </div>
        </div>
        {uploadedFiles.documents.length > 0 && (
          <div className="uploaded-files">
            {uploadedFiles.documents.map((file, index) => (
              <div key={index} className="file-item">
                <span>{file.name}</span>
                <button type="button" onClick={() => removeFile('documents', index)}>×</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {otpSent && (
        <div className="form-group">
          <label>Enter OTP *</label>
          <input
            type="text"
            name="otp"
            value={formData.otp}
            onChange={handleChange}
            placeholder="Enter 6-digit OTP"
            maxLength="6"
            required
          />
          <div className="otp-info">
            <small>OTP sent to {formData.email}</small>
            <div className="demo-otp">
              <strong>🚀 DEMO MODE: Use OTP: 123456</strong>
            </div>
          </div>
        </div>
      )}

      <button type="submit" disabled={loading} className="submit-btn">
        {loading ? (
          <>
            <div className="spinner"></div>
            {otpSent ? 'Verifying...' : 'Sending OTP...'}
          </>
        ) : (
          otpSent ? 'Verify & Register' : 'Send OTP'
        )}
      </button>
    </form>
  );

  const renderDirectForm = () => (
    <div className="direct-registration">
      {currentStep === 2 && (
        <form className="registration-form">
          <div className="form-header">
            <h2>🏪 Direct Registration</h2>
            <p>Complete your salon registration with our assistance</p>
          </div>

          <div className="form-group">
            <label>Salon Name *</label>
            <input
              type="text"
              name="salonName"
              value={formData.salonName}
              onChange={handleChange}
              placeholder="Enter your salon name"
              required
            />
          </div>

          <div className="form-group">
            <label>Email Address *</label>
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
            <label>Phone Number *</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Enter your phone number"
              required
            />
          </div>

          <div className="form-group">
            <label>Business Address *</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Enter your complete business address"
              required
            />
          </div>

          <div className="form-group">
            <label>Password *</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a strong password"
              required
            />
          </div>

          <div className="form-group">
            <label>Upload Shop Images *</label>
            <div className="file-upload-area">
              <input
                type="file"
                multiple
                accept=".jpg,.jpeg,.png"
                onChange={(e) => handleFileUpload('shopImages', e.target.files)}
                className="file-input"
              />
              <div className="upload-text">
                <p>📸 Upload clear photos of your salon (interior, exterior, services)</p>
                <small>Minimum 3 images required (JPG, PNG - Max 5MB each)</small>
              </div>
            </div>
            {uploadedFiles.shopImages.length > 0 && (
              <div className="uploaded-files">
                {uploadedFiles.shopImages.map((file, index) => (
                  <div key={index} className="file-item">
                    <span>{file.name}</span>
                    <button type="button" onClick={() => removeFile('shopImages', index)}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Upload Documents *</label>
            <div className="file-upload-area">
              <input
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => handleFileUpload('documents', e.target.files)}
                className="file-input"
              />
              <div className="upload-text">
                <p>📄 Upload business license, GST certificate, owner ID proof</p>
                <small>Supported: PDF, JPG, PNG (Max 5MB each)</small>
              </div>
            </div>
            {uploadedFiles.documents.length > 0 && (
              <div className="uploaded-files">
                {uploadedFiles.documents.map((file, index) => (
                  <div key={index} className="file-item">
                    <span>{file.name}</span>
                    <button type="button" onClick={() => removeFile('documents', index)}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="payment-section">
            <div className="payment-info">
              <h3>💰 Registration Fee</h3>
              <p>One-time registration fee: <strong>₹100</strong></p>
              <ul>
                <li>✅ Complete salon setup assistance</li>
                <li>✅ Call from our expert agent</li>
                <li>✅ Google Maps listing creation</li>
                <li>✅ 24/7 customer support</li>
              </ul>
            </div>
            <button 
              type="button" 
              onClick={handlePayment}
              disabled={loading || uploadedFiles.shopImages.length < 3 || uploadedFiles.documents.length === 0}
              className="payment-btn"
            >
              {loading ? (
                <>
                  <div className="spinner"></div>
                  {razorpayLoaded ? 'Opening Razorpay...' : 'Loading Payment...'}
                </>
              ) : (
                <>
                  💳 Pay ₹100 via Razorpay
                  {!razorpayLoaded && <small style={{display: 'block', fontSize: '12px', opacity: 0.8}}>
                    (Demo mode - Razorpay loading...)
                  </small>}
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {currentStep === 3 && (
        <div className="success-message">
          <div className="success-icon">✅</div>
          <h2>Registration Successful!</h2>
          <p>Thank you for registering with us. Here's what happens next:</p>
          <div className="next-steps">
            <div className="step">
              <span className="step-number">1</span>
              <div>
                <h4>Agent Call</h4>
                <p>Our expert agent will call you within 24 hours to assist with setup</p>
              </div>
            </div>
            <div className="step">
              <span className="step-number">2</span>
              <div>
                <h4>Document Verification</h4>
                <p>We'll verify your uploaded documents and images</p>
              </div>
            </div>
            <div className="step">
              <span className="step-number">3</span>
              <div>
                <h4>Google Maps Listing</h4>
                <p>We'll create and optimize your Google Maps business listing</p>
              </div>
            </div>
            <div className="step">
              <span className="step-number">4</span>
              <div>
                <h4>Dashboard Access</h4>
                <p>You'll receive login credentials to access your salon dashboard</p>
              </div>
            </div>
          </div>
          <button onClick={() => setIsRegister(false)} className="continue-btn">
            Continue to Login
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="owner-login">
      <div className="login-container">
        <div className="login-header">
          <h1>💼 Salon Owner Portal</h1>
          <p>{isRegister ? 'Register your salon with us' : 'Manage your salon queue'}</p>
        </div>

        {!isRegister ? (
          // Login Form
          <form onSubmit={handleSubmit} className="login-form">
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
                  Logging in...
                </>
              ) : (
                'Login to Dashboard'
              )}
            </button>
          </form>
        ) : (
          // Registration Forms
          <div className="registration-container">
            {!registrationType && renderRegistrationOptions()}
            {registrationType === 'google-maps' && renderGoogleMapsForm()}
            {registrationType === 'direct' && renderDirectForm()}
            
            {registrationType && (
              <button 
                onClick={() => {
                  setRegistrationType('');
                  setCurrentStep(1);
                  setOtpSent(false);
                }}
                className="back-btn"
              >
                ← Back to Options
              </button>
            )}
          </div>
        )}

        <div className="login-footer">
          <p>
            {isRegister ? 'Already have an account?' : "Don't have an account?"}
            <button 
              onClick={() => {
                setIsRegister(!isRegister);
                setRegistrationType('');
                setCurrentStep(1);
                setOtpSent(false);
              }}
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
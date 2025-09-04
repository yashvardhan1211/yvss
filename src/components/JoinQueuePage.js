import React, { useState, useEffect } from 'react';

const JoinQueuePage = ({ salon, onClose, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedServices, setSelectedServices] = useState([]);
  const [customerDetails, setCustomerDetails] = useState({
    name: '',
    phone: '',
    email: ''
  });

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const services = [
    { id: 1, name: 'Traditional men\'s haircut', duration: '30 min', price: 250 },
    { id: 2, name: 'Beard Trim + Shape', duration: '20 min', price: 150 },
    { id: 3, name: 'Hair Wash + Style', duration: '15 min', price: 100 },
    { id: 4, name: 'Premium Styling', duration: '45 min', price: 400 }
  ];

  const toggleService = (serviceId) => {
    setSelectedServices(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const getSelectedServicesTotal = () => {
    return selectedServices.reduce((total, serviceId) => {
      const service = services.find(s => s.id === serviceId);
      return total + (service ? service.price : 0);
    }, 0);
  };

  const getSelectedServicesDuration = () => {
    return selectedServices.reduce((total, serviceId) => {
      const service = services.find(s => s.id === serviceId);
      return total + (service ? parseInt(service.duration) : 0);
    }, 0);
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      onClose();
    }
  };

  const handlePayment = () => {
    // Initialize Razorpay payment
    const options = {
      key: process.env.REACT_APP_RAZORPAY_KEY_ID || 'rzp_test_1234567890',
      amount: getSelectedServicesTotal() * 100, // Amount in paise
      currency: 'INR',
      name: 'Real Salon Finder',
      description: 'Queue Payment',
      handler: function (response) {
        // Payment successful
        console.log('Payment successful:', response);
        setCurrentStep(4);
      },
      prefill: {
        name: customerDetails.name,
        email: customerDetails.email,
        contact: customerDetails.phone
      },
      theme: {
        color: '#4facfe'
      },
      modal: {
        ondismiss: function() {
          console.log('Payment cancelled');
        }
      }
    };

    if (window.Razorpay) {
      const rzp = new window.Razorpay(options);
      rzp.open();
    } else {
      // Fallback if Razorpay is not loaded
      console.log('Razorpay not loaded, simulating payment...');
      setTimeout(() => {
        setCurrentStep(4);
      }, 2000);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div style={{ padding: '24px' }}>
            {/* Queue Status */}
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(15px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '16px',
              padding: '24px',
              marginBottom: '24px',
              textAlign: 'center',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{ fontSize: '48px', fontWeight: '700', color: '#ffffff', marginBottom: '8px', textShadow: '0 0 20px rgba(255, 255, 255, 0.5)' }}>
                #{salon.queueLength + 1}
              </div>
              <div style={{ fontSize: '16px', color: 'rgba(255, 255, 255, 0.9)', marginBottom: '4px' }}>
                Your position in queue
              </div>
              <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.8)', fontWeight: '500' }}>
                ~{salon.queueLength * 15} min wait time
              </div>
            </div>

            {/* Services Selection */}
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#ffffff', textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)' }}>
              Select Services
            </h3>
            
            <div style={{ marginBottom: '24px' }}>
              {services.map(service => (
                <div
                  key={service.id}
                  onClick={() => toggleService(service.id)}
                  style={{
                    backgroundColor: selectedServices.includes(service.id) ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.15)',
                    backdropFilter: 'blur(10px)',
                    border: selectedServices.includes(service.id) ? '2px solid rgba(255, 255, 255, 0.6)' : '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '12px',
                    padding: '16px',
                    marginBottom: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.3s ease',
                    boxShadow: selectedServices.includes(service.id) ? '0 8px 32px rgba(255, 255, 255, 0.1)' : '0 4px 16px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: '500', color: '#ffffff', marginBottom: '4px' }}>
                      {service.name}
                    </div>
                    <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.8)' }}>
                      {service.duration}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '16px', fontWeight: '600', color: '#ffffff' }}>
                      ₹{service.price}
                    </span>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      border: '2px solid rgba(255, 255, 255, 0.6)',
                      backgroundColor: selectedServices.includes(service.id) ? 'rgba(255, 255, 255, 0.9)' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: selectedServices.includes(service.id) ? '0 0 15px rgba(255, 255, 255, 0.5)' : 'none'
                    }}>
                      {selectedServices.includes(service.id) && (
                        <span style={{ color: '#4facfe', fontSize: '12px', fontWeight: 'bold' }}>✓</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {selectedServices.length > 0 && (
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(15px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '24px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.8)' }}>Total Duration:</span>
                  <span style={{ fontSize: '14px', fontWeight: '500', color: '#ffffff' }}>{getSelectedServicesDuration()} min</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '16px', fontWeight: '600', color: '#ffffff' }}>Total Amount:</span>
                  <span style={{ fontSize: '16px', fontWeight: '600', color: '#ffffff', textShadow: '0 0 10px rgba(255, 255, 255, 0.5)' }}>₹{getSelectedServicesTotal()}</span>
                </div>
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '24px', color: '#212529' }}>
              Your Details
            </h3>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#495057' }}>
                Full Name *
              </label>
              <input
                type="text"
                value={customerDetails.name}
                onChange={(e) => setCustomerDetails({...customerDetails, name: e.target.value})}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ced4da',
                  borderRadius: '6px',
                  fontSize: '16px',
                  outline: 'none',
                  transition: 'border-color 0.2s ease'
                }}
                placeholder="Enter your full name"
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#495057' }}>
                Phone Number *
              </label>
              <input
                type="tel"
                value={customerDetails.phone}
                onChange={(e) => setCustomerDetails({...customerDetails, phone: e.target.value})}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ced4da',
                  borderRadius: '6px',
                  fontSize: '16px',
                  outline: 'none',
                  transition: 'border-color 0.2s ease'
                }}
                placeholder="Enter your phone number"
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#495057' }}>
                Email (Optional)
              </label>
              <input
                type="email"
                value={customerDetails.email}
                onChange={(e) => setCustomerDetails({...customerDetails, email: e.target.value})}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ced4da',
                  borderRadius: '6px',
                  fontSize: '16px',
                  outline: 'none',
                  transition: 'border-color 0.2s ease'
                }}
                placeholder="Enter your email"
              />
            </div>

            {/* Selected Services Summary */}
            <div style={{
              backgroundColor: '#f8f9fa',
              border: '1px solid #e9ecef',
              borderRadius: '8px',
              padding: '16px'
            }}>
              <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>Selected Services</h4>
              {selectedServices.map(serviceId => {
                const service = services.find(s => s.id === serviceId);
                return (
                  <div key={serviceId} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '14px' }}>{service.name}</span>
                    <span style={{ fontSize: '14px', fontWeight: '500' }}>₹{service.price}</span>
                  </div>
                );
              })}
              <hr style={{ margin: '12px 0', border: 'none', borderTop: '1px solid #dee2e6' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '16px', fontWeight: '600' }}>Total:</span>
                <span style={{ fontSize: '16px', fontWeight: '600', color: '#007bff' }}>₹{getSelectedServicesTotal()}</span>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div style={{ padding: '24px', textAlign: 'center' }}>
            <div style={{ marginBottom: '32px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>💳</div>
              <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px', color: '#212529' }}>
                Payment
              </h3>
              <p style={{ fontSize: '14px', color: '#6c757d' }}>
                Secure your spot in the queue with payment
              </p>
            </div>

            <div style={{
              backgroundColor: '#f8f9fa',
              border: '1px solid #e9ecef',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '24px'
            }}>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '14px', color: '#6c757d', marginBottom: '4px' }}>Amount to Pay</div>
                <div style={{ fontSize: '32px', fontWeight: '700', color: '#007bff' }}>₹{getSelectedServicesTotal()}</div>
              </div>
              <div style={{ fontSize: '12px', color: '#6c757d' }}>
                This payment guarantees your position #{salon.queueLength + 1} in the queue
              </div>
            </div>

            <button
              onClick={handlePayment}
              style={{
                width: '100%',
                padding: '16px',
                backgroundColor: '#007bff',
                border: 'none',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                marginBottom: '16px'
              }}
            >
              Pay ₹{getSelectedServicesTotal()}
            </button>

            <div style={{ fontSize: '12px', color: '#6c757d' }}>
              🔒 Secure payment powered by Razorpay
            </div>
          </div>
        );

      case 4:
        return (
          <div style={{ padding: '24px', textAlign: 'center' }}>
            <div style={{ marginBottom: '32px' }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
              <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px', color: '#28a745' }}>
                You're in the Queue!
              </h3>
              <p style={{ fontSize: '14px', color: '#6c757d' }}>
                Payment successful. Your spot is confirmed.
              </p>
            </div>

            <div style={{
              backgroundColor: '#d4edda',
              border: '1px solid #c3e6cb',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '24px'
            }}>
              <div style={{ fontSize: '48px', fontWeight: '700', color: '#155724', marginBottom: '8px' }}>
                #{salon.queueLength + 1}
              </div>
              <div style={{ fontSize: '16px', color: '#155724', marginBottom: '8px' }}>
                Your position in queue
              </div>
              <div style={{ fontSize: '14px', color: '#155724' }}>
                Estimated wait: ~{salon.queueLength * 15} minutes
              </div>
            </div>

            <div style={{
              backgroundColor: '#f8f9fa',
              border: '1px solid #e9ecef',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '24px',
              textAlign: 'left'
            }}>
              <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>Booking Details</h4>
              <div style={{ marginBottom: '8px' }}>
                <strong>Salon:</strong> {salon.name}
              </div>
              <div style={{ marginBottom: '8px' }}>
                <strong>Customer:</strong> {customerDetails.name}
              </div>
              <div style={{ marginBottom: '8px' }}>
                <strong>Phone:</strong> {customerDetails.phone}
              </div>
              <div style={{ marginBottom: '12px' }}>
                <strong>Services:</strong>
              </div>
              {selectedServices.map(serviceId => {
                const service = services.find(s => s.id === serviceId);
                return (
                  <div key={serviceId} style={{ marginLeft: '16px', marginBottom: '4px', fontSize: '14px' }}>
                    • {service.name} - ₹{service.price}
                  </div>
                );
              })}
              <hr style={{ margin: '12px 0', border: 'none', borderTop: '1px solid #dee2e6' }} />
              <div style={{ fontWeight: '600' }}>
                <strong>Total Paid:</strong> ₹{getSelectedServicesTotal()}
              </div>
            </div>

            <button
              onClick={() => onComplete()}
              style={{
                width: '100%',
                padding: '16px',
                backgroundColor: '#28a745',
                border: 'none',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Done
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      zIndex: 99999,
      overflowY: 'auto'
    }}>
      <div style={{
        maxWidth: '500px',
        margin: '0 auto',
        minHeight: '100vh',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
          backgroundColor: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(10px)',
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button
              onClick={handleBack}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                fontSize: '16px',
                cursor: 'pointer',
                padding: '4px',
                color: '#ffffff'
              }}
            >
              ← Back
            </button>
            <h1 style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: '600',
              color: '#ffffff',
              textAlign: 'center',
              flex: 1
            }}>
              {currentStep === 1 && 'Join Queue'}
              {currentStep === 2 && 'Your Details'}
              {currentStep === 3 && 'Payment'}
              {currentStep === 4 && 'Confirmed'}
            </h1>
            <div style={{ width: '60px' }}></div>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{
          padding: '20px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            {[1, 2, 3, 4].map(step => (
              <div key={step} style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: step <= currentStep ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.3)',
                  color: step <= currentStep ? '#4facfe' : 'rgba(255, 255, 255, 0.7)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: '600',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: step <= currentStep ? '0 4px 15px rgba(255, 255, 255, 0.2)' : 'none'
                }}>
                  {step < currentStep ? '✓' : step}
                </div>
                {step < 4 && (
                  <div style={{
                    width: '24px',
                    height: '2px',
                    backgroundColor: step < currentStep ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.3)',
                    margin: '0 4px'
                  }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        {renderStepContent()}

        {/* Footer */}
        {currentStep < 4 && (
          <div style={{
            padding: '20px',
            borderTop: '1px solid #e9ecef',
            backgroundColor: '#ffffff',
            position: 'sticky',
            bottom: 0
          }}>
            <button
              onClick={handleNext}
              disabled={
                (currentStep === 1 && selectedServices.length === 0) ||
                (currentStep === 2 && (!customerDetails.name || !customerDetails.phone))
              }
              style={{
                width: '100%',
                padding: '16px',
                backgroundColor: 
                  (currentStep === 1 && selectedServices.length === 0) ||
                  (currentStep === 2 && (!customerDetails.name || !customerDetails.phone))
                    ? '#e9ecef' : '#007bff',
                border: 'none',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 
                  (currentStep === 1 && selectedServices.length === 0) ||
                  (currentStep === 2 && (!customerDetails.name || !customerDetails.phone))
                    ? 'not-allowed' : 'pointer'
              }}
            >
              {currentStep === 1 && 'Continue'}
              {currentStep === 2 && 'Proceed to Payment'}
              {currentStep === 3 && 'Processing...'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default JoinQueuePage;

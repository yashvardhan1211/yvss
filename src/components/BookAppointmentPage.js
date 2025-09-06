import React, { useState } from 'react';

const BookAppointmentPage = ({ salon, onClose, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedServices, setSelectedServices] = useState([]);
  const [customerDetails, setCustomerDetails] = useState({
    name: '',
    phone: '',
    email: ''
  });

  const services = [
    { id: 1, name: 'Traditional men\'s haircut', duration: '30 min', price: 250 },
    { id: 2, name: 'Beard Trim + Shape', duration: '20 min', price: 150 },
    { id: 3, name: 'Hair Wash + Style', duration: '15 min', price: 100 },
    { id: 4, name: 'Premium Styling', duration: '45 min', price: 400 }
  ];

  const timeSlots = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '12:00 PM', '12:30 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
    '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM'
  ];

  const getNextSevenDays = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      days.push({
        date: date.toISOString().split('T')[0],
        display: date.toLocaleDateString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric' 
        })
      });
    }
    return days;
  };

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

  const handleBooking = () => {
    // Calculate total amount
    const totalAmount = selectedServices.reduce((total, serviceId) => {
      const service = services.find(s => s.id === serviceId);
      return total + service.price;
    }, 0);

    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => {
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID || 'rzp_test_9WaALb7AGtN5BB',
        amount: totalAmount * 100, // Convert to paise
        currency: 'INR',
        name: salon.name,
        description: 'Appointment Booking',
        handler: function(response) {
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
          color: '#ff9a9e'
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
      }
    };
    document.head.appendChild(script);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '24px', color: '#ffffff' }}>
              Select Date & Time
            </h3>
            
            {/* Date Selection */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '12px', color: 'rgba(255, 255, 255, 0.8)' }}>
                Choose Date
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '8px' }}>
                {getNextSevenDays().map(day => (
                  <button
                    key={day.date}
                    onClick={() => setSelectedDate(day.date)}
                    style={{
                      padding: '12px 8px',
                      border: selectedDate === day.date ? '2px solid #4fc3f7' : '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '8px',
                      backgroundColor: selectedDate === day.date ? 'rgba(79, 195, 247, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                      color: selectedDate === day.date ? '#4fc3f7' : '#ffffff',
                      fontSize: '12px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    {day.display}
                  </button>
                ))}
              </div>
            </div>

            {/* Time Selection */}
            {selectedDate && (
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '12px', color: 'rgba(255, 255, 255, 0.8)' }}>
                  Choose Time
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {timeSlots.map(time => (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      style={{
                        padding: '10px',
                        border: selectedTime === time ? '2px solid #4fc3f7' : '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '6px',
                        backgroundColor: selectedTime === time ? 'rgba(79, 195, 247, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                        color: selectedTime === time ? '#4fc3f7' : '#ffffff',
                        fontSize: '13px',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedDate && selectedTime && (
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                padding: '16px'
              }}>
                <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '4px' }}>
                  Selected Appointment
                </div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#ffffff' }}>
                  {new Date(selectedDate).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })} at {selectedTime}
                </div>
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '24px', color: '#ffffff' }}>
              Select Services
            </h3>
            
            <div style={{ marginBottom: '24px' }}>
              {services.map(service => (
                <div
                  key={service.id}
                  onClick={() => toggleService(service.id)}
                  style={{
                    backgroundColor: selectedServices.includes(service.id) ? 'rgba(79, 195, 247, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                    border: selectedServices.includes(service.id) ? '2px solid #4fc3f7' : '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    padding: '16px',
                    marginBottom: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: '500', color: '#ffffff', marginBottom: '4px' }}>
                      {service.name}
                    </div>
                    <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }}>
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
                      border: '2px solid #4fc3f7',
                      backgroundColor: selectedServices.includes(service.id) ? '#4fc3f7' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {selectedServices.includes(service.id) && (
                        <span style={{ color: '#ffffff', fontSize: '12px' }}>✓</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {selectedServices.length > 0 && (
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                padding: '16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '16px', fontWeight: '600', color: '#ffffff' }}>Total Amount:</span>
                  <span style={{ fontSize: '16px', fontWeight: '600', color: '#4fc3f7' }}>₹{getSelectedServicesTotal()}</span>
                </div>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '24px', color: '#ffffff' }}>
              Your Details
            </h3>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: 'rgba(255, 255, 255, 0.8)' }}>
                Full Name *
              </label>
              <input
                type="text"
                value={customerDetails.name}
                onChange={(e) => setCustomerDetails({...customerDetails, name: e.target.value})}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '6px',
                  fontSize: '16px',
                  outline: 'none',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: '#ffffff'
                }}
                placeholder="Enter your full name"
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: 'rgba(255, 255, 255, 0.8)' }}>
                Phone Number *
              </label>
              <input
                type="tel"
                value={customerDetails.phone}
                onChange={(e) => setCustomerDetails({...customerDetails, phone: e.target.value})}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '6px',
                  fontSize: '16px',
                  outline: 'none',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: '#ffffff'
                }}
                placeholder="Enter your phone number"
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: 'rgba(255, 255, 255, 0.8)' }}>
                Email (Optional)
              </label>
              <input
                type="email"
                value={customerDetails.email}
                onChange={(e) => setCustomerDetails({...customerDetails, email: e.target.value})}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '6px',
                  fontSize: '16px',
                  outline: 'none',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: '#ffffff'
                }}
                placeholder="Enter your email"
              />
            </div>

            {/* Booking Summary */}
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '16px'
            }}>
              <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#ffffff' }}>Booking Summary</h4>
              <div style={{ marginBottom: '8px', color: '#ffffff' }}>
                <strong>Date & Time:</strong> {new Date(selectedDate).toLocaleDateString()} at {selectedTime}
              </div>
              <div style={{ marginBottom: '12px', color: '#ffffff' }}>
                <strong>Services:</strong>
              </div>
              {selectedServices.map(serviceId => {
                const service = services.find(s => s.id === serviceId);
                return (
                  <div key={serviceId} style={{ marginLeft: '16px', marginBottom: '4px', fontSize: '14px', color: 'rgba(255, 255, 255, 0.8)' }}>
                    • {service.name} - ₹{service.price}
                  </div>
                );
              })}
              <hr style={{ margin: '12px 0', border: 'none', borderTop: '1px solid rgba(255, 255, 255, 0.2)' }} />
              <div style={{ fontWeight: '600', color: '#ffffff' }}>
                <strong>Total:</strong> ₹{getSelectedServicesTotal()}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div style={{ padding: '24px', textAlign: 'center' }}>
            <div style={{ marginBottom: '32px' }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>📅</div>
              <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px', color: '#28a745' }}>
                Appointment Booked!
              </h3>
              <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }}>
                Your appointment has been successfully scheduled.
              </p>
            </div>

            <div style={{
              backgroundColor: 'rgba(76, 175, 80, 0.2)',
              border: '1px solid rgba(76, 175, 80, 0.3)',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '24px'
            }}>
              <div style={{ fontSize: '18px', fontWeight: '600', color: '#4caf50', marginBottom: '8px' }}>
                {new Date(selectedDate).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#4caf50' }}>
                {selectedTime}
              </div>
            </div>

            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '24px',
              textAlign: 'left'
            }}>
              <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#ffffff' }}>Appointment Details</h4>
              <div style={{ marginBottom: '8px', color: '#ffffff' }}>
                <strong>Salon:</strong> {salon.name}
              </div>
              <div style={{ marginBottom: '8px', color: '#ffffff' }}>
                <strong>Customer:</strong> {customerDetails.name}
              </div>
              <div style={{ marginBottom: '8px', color: '#ffffff' }}>
                <strong>Phone:</strong> {customerDetails.phone}
              </div>
              <div style={{ marginBottom: '12px', color: '#ffffff' }}>
                <strong>Services:</strong>
              </div>
              {selectedServices.map(serviceId => {
                const service = services.find(s => s.id === serviceId);
                return (
                  <div key={serviceId} style={{ marginLeft: '16px', marginBottom: '4px', fontSize: '14px', color: 'rgba(255, 255, 255, 0.8)' }}>
                    • {service.name} - ₹{service.price}
                  </div>
                );
              })}
              <hr style={{ margin: '12px 0', border: 'none', borderTop: '1px solid rgba(255, 255, 255, 0.2)' }} />
              <div style={{ fontWeight: '600', color: '#ffffff' }}>
                <strong>Total:</strong> ₹{getSelectedServicesTotal()}
              </div>
            </div>

                          <button
              onClick={() => onComplete()}
              style={{
                width: '100%',
                padding: '16px',
                backgroundColor: '#4caf50',
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
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      zIndex: 99999,
      overflowY: 'auto'
    }}>
      <style>
        {`
          input::placeholder {
            color: rgba(255, 255, 255, 0.5) !important;
          }
          input {
            color: #ffffff !important;
          }
          input:focus {
            color: #ffffff !important;
          }
        `}
      </style>
      <div style={{
        maxWidth: '500px',
        margin: '0 auto',
        minHeight: '100vh',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(20px)',
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
                color: '#4fc3f7'
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
              {currentStep === 1 && 'Book Appointment'}
              {currentStep === 2 && 'Select Services'}
              {currentStep === 3 && 'Your Details'}
              {currentStep === 4 && 'Confirmed'}
            </h1>
            <div style={{ width: '60px' }}></div>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{
          padding: '20px',
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            {[1, 2, 3, 4].map(step => (
              <div key={step} style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: step <= currentStep ? '#4fc3f7' : 'rgba(255, 255, 255, 0.2)',
                  color: step <= currentStep ? '#ffffff' : 'rgba(255, 255, 255, 0.6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: '600'
                }}>
                  {step < currentStep ? '✓' : step}
                </div>
                {step < 4 && (
                  <div style={{
                    width: '24px',
                    height: '2px',
                    backgroundColor: step < currentStep ? '#4fc3f7' : 'rgba(255, 255, 255, 0.2)',
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
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(15px)',
            position: 'sticky',
            bottom: 0,
            marginTop: '24px'
          }}>
            <button
              onClick={currentStep === 3 ? handleBooking : handleNext}
              disabled={
                (currentStep === 1 && (!selectedDate || !selectedTime)) ||
                (currentStep === 2 && selectedServices.length === 0) ||
                (currentStep === 3 && (!customerDetails.name || !customerDetails.phone))
              }
              style={{
                width: '100%',
                padding: '16px',
                backgroundColor: 
                  (currentStep === 1 && (!selectedDate || !selectedTime)) ||
                  (currentStep === 2 && selectedServices.length === 0) ||
                  (currentStep === 3 && (!customerDetails.name || !customerDetails.phone))
                    ? 'rgba(255, 255, 255, 0.1)' : 'rgba(79, 195, 247, 0.3)',
                backdropFilter: 'blur(15px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
                color: '#ffffff',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 
                  (currentStep === 1 && (!selectedDate || !selectedTime)) ||
                  (currentStep === 2 && selectedServices.length === 0) ||
                  (currentStep === 3 && (!customerDetails.name || !customerDetails.phone))
                    ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
                transition: 'all 0.3s ease'
              }}
            >
              {currentStep === 1 && 'Continue'}
              {currentStep === 2 && 'Continue'}
              {currentStep === 3 && 'Book Appointment'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookAppointmentPage;

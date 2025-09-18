import React, { useState } from 'react';
import { processRazorpayPayment } from '../services/paymentService';
import toast from 'react-hot-toast';
import './QueueModal.css';

const QueueModal = ({ salon, onClose, onJoinQueue, services }) => {
  const [step, setStep] = useState(1); // 1: Services, 2: Details, 3: Payment
  const [selectedServices, setSelectedServices] = useState([]);
  const [customerDetails, setCustomerDetails] = useState({
    name: '',
    phone: '',
    email: '',
    notificationPreference: 'both'
  });

  const handleServiceToggle = (service) => {
    const isSelected = selectedServices.find(s => s.id === service.id);
    if (isSelected) {
      setSelectedServices(selectedServices.filter(s => s.id !== service.id));
    } else {
      setSelectedServices([...selectedServices, service]);
    }
  };

  const getTotalAmount = () => {
    return selectedServices.reduce((total, service) => total + service.price, 0);
  };

  const getTotalDuration = () => {
    return selectedServices.reduce((total, service) => total + service.duration, 0);
  };

  const handleContinueToDetails = () => {
    if (selectedServices.length === 0) {
      toast.error('Please select at least one service');
      return;
    }
    setStep(2);
  };

  const handleJoinQueueWithPayment = async () => {
    if (!customerDetails.name || !customerDetails.phone) {
      toast.error('Please fill in all required details');
      return;
    }

    const queueData = {
      ...customerDetails,
      selectedServices,
      totalAmount: getTotalAmount(),
      totalDuration: getTotalDuration(),
      salonName: salon.name,
      salonId: salon.id
    };

    try {
      // Process payment with Razorpay
      const paymentResult = await processRazorpayPayment(queueData);
      
      // If payment successful, join queue
      if (paymentResult && paymentResult.success) {
        // Add payment ID to queue data
        const updatedQueueData = {
          ...queueData,
          paymentId: paymentResult.paymentData.razorpay_payment_id
        };
        
        toast.success('Payment successful! Welcome to the queue!');
        
        // Join queue with payment data
        await onJoinQueue(updatedQueueData);
      }
    } catch (error) {
      console.error('Payment or queue join failed:', error);
      toast.error(error.message || 'Payment failed. Please try again.');
    }
  };

  return (
    <div className="queue-modal-overlay">
      <div className="queue-modal">
        <div className="queue-modal-header">
          <h2>Join Queue - {salon.name}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="queue-modal-steps">
          <div className={`step ${step >= 1 ? 'active' : ''}`}>
            <span>1</span> Services
          </div>
          <div className={`step ${step >= 2 ? 'active' : ''}`}>
            <span>2</span> Details
          </div>
          <div className={`step ${step >= 3 ? 'active' : ''}`}>
            <span>3</span> Payment
          </div>
        </div>

        <div className="queue-modal-content">
          {step === 1 && (
            <div className="service-selection">
              <h3>🎯 Select Your Services</h3>
              <p className="queue-info">
                ✨ Choose the services you'd like when it's your turn. Secure payment ensures your guaranteed spot in the queue.
              </p>
              
              <div className="services-grid">
                {services.map(service => (
                  <div 
                    key={service.id}
                    className={`service-card ${selectedServices.find(s => s.id === service.id) ? 'selected' : ''}`}
                    onClick={() => handleServiceToggle(service)}
                  >
                    <div className="service-info">
                      <h4>{service.name}</h4>
                      <p className="service-description">{service.description}</p>
                      <div className="service-meta">
                        <span className="duration">⏱️ {service.duration} min</span>
                        <span className="price">₹{service.price}</span>
                      </div>
                    </div>
                    <div className="service-checkbox"></div>
                  </div>
                ))}
              </div>
              
              {selectedServices.length > 0 && (
                <div className="selection-summary">
                  <div className="summary-info">
                    <p><strong>Selected:</strong> {selectedServices.length} service(s)</p>
                    <p><strong>Total Duration:</strong> {getTotalDuration()} minutes</p>
                    <p><strong>Total Amount:</strong> ₹{getTotalAmount()}</p>
                  </div>
                  <button 
                    className="continue-btn"
                    onClick={handleContinueToDetails}
                  >
                    Continue to Details
                  </button>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="customer-details">
              <h3>📝 Your Information</h3>
              <p className="queue-info">
                🔔 Stay updated with real-time notifications about your queue position and estimated arrival time.
              </p>
              
              <div className="form-grid">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    value={customerDetails.name}
                    onChange={(e) => setCustomerDetails({...customerDetails, name: e.target.value})}
                    placeholder="Enter your full name"
                  />
                </div>
                
                <div className="form-group">
                  <label>Phone Number *</label>
                  <input
                    type="tel"
                    value={customerDetails.phone}
                    onChange={(e) => setCustomerDetails({...customerDetails, phone: e.target.value})}
                    placeholder="Enter your phone number"
                  />
                </div>
                
                <div className="form-group">
                  <label>Email (Optional)</label>
                  <input
                    type="email"
                    value={customerDetails.email}
                    onChange={(e) => setCustomerDetails({...customerDetails, email: e.target.value})}
                    placeholder="Enter your email for updates"
                  />
                </div>
                
                <div className="form-group full-width">
                  <label>Notification Preference</label>
                  <select
                    value={customerDetails.notificationPreference}
                    onChange={(e) => setCustomerDetails({...customerDetails, notificationPreference: e.target.value})}
                  >
                    <option value="both">📱 SMS + 🔔 Push Notifications</option>
                    <option value="sms">📱 SMS Only</option>
                    <option value="push">🔔 Push Notifications Only</option>
                  </select>
                </div>
              </div>
              
              <div className="queue-summary">
                <h4>Queue Summary</h4>
                <div className="summary-details">
                  <div className="summary-item">
                    <span>Current Queue Length:</span>
                    <span>{salon.queueLength} people</span>
                  </div>
                  <div className="summary-item">
                    <span>Estimated Wait Time:</span>
                    <span>~{salon.waitTime} minutes</span>
                  </div>
                  <div className="summary-item">
                    <span>Your Position (after joining):</span>
                    <span>#{salon.queueLength + 1}</span>
                  </div>
                  <div className="summary-divider"></div>
                  {selectedServices.map(service => (
                    <div key={service.id} className="summary-item">
                      <span>{service.name}</span>
                      <span>₹{service.price}</span>
                    </div>
                  ))}
                  <div className="summary-total">
                    <strong>Total Amount: ₹{getTotalAmount()}</strong>
                  </div>
                </div>
              </div>


            </div>
          )}
        </div>

        {/* Fixed Action Buttons */}
        <div className="queue-modal-actions">
          {step === 2 && (
            <>
              <button 
                className="back-btn"
                onClick={() => setStep(1)}
              >
                ← Back to Services
              </button>
              <button 
                className="pay-join-btn glass-morphism"
                onClick={handleJoinQueueWithPayment}
              >
                Pay ₹{getTotalAmount()}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default QueueModal;
import React, { useState } from 'react';
import { processRazorpayPayment } from '../services/paymentService';
import { createBooking } from '../services/salonService';
import toast from 'react-hot-toast';
import './BookingModal.css';

const BookingModal = ({ salon, isOpen, onClose, onBookingComplete }) => {
  const [step, setStep] = useState(1); // 1: Service Selection, 2: Details, 3: Payment
  const [bookingData, setBookingData] = useState({
    salonId: salon?.place_id || salon?.id,
    salonName: salon?.name,
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    selectedServices: [],
    preferredTime: '',
    specialRequests: '',
    totalAmount: 0
  });

  const services = salon?.services?.map((service, index) => ({
    id: index + 1,
    name: service,
    duration: 30 + (index * 15), // Varying durations
    price: 25 + (index * 10) // Varying prices
  })) || [
    { id: 1, name: 'Haircut', duration: 30, price: 25 },
    { id: 2, name: 'Hair Styling', duration: 45, price: 35 },
    { id: 3, name: 'Facial', duration: 60, price: 50 },
    { id: 4, name: 'Beard Trim', duration: 15, price: 15 }
  ];

  const timeSlots = [
    '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
    '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM'
  ];

  const handleServiceToggle = (service) => {
    const isSelected = bookingData.selectedServices.find(s => s.id === service.id);
    let newServices;
    
    if (isSelected) {
      newServices = bookingData.selectedServices.filter(s => s.id !== service.id);
    } else {
      newServices = [...bookingData.selectedServices, service];
    }
    
    const totalAmount = newServices.reduce((sum, s) => sum + s.price, 0);
    
    setBookingData({
      ...bookingData,
      selectedServices: newServices,
      totalAmount
    });
  };

  const handleInputChange = (e) => {
    setBookingData({
      ...bookingData,
      [e.target.name]: e.target.value
    });
  };

  const handleNext = () => {
    if (step === 1 && bookingData.selectedServices.length === 0) {
      alert('Please select at least one service');
      return;
    }
    
    if (step === 2) {
      if (!bookingData.customerName || !bookingData.customerEmail || !bookingData.preferredTime) {
        alert('Please fill in all required fields');
        return;
      }
    }
    
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleBookingComplete = (paymentResult) => {
    onBookingComplete({
      ...bookingData,
      paymentResult,
      bookingId: `booking_${Date.now()}`
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="booking-modal-overlay">
      <div className="booking-modal">
        <div className="booking-header">
          <h2>📅 Book Appointment</h2>
          <button onClick={onClose} className="close-btn">×</button>
        </div>

        <div className="booking-progress">
          <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>
            <span>1</span>
            <p>Services</p>
          </div>
          <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>
            <span>2</span>
            <p>Details</p>
          </div>
          <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>
            <span>3</span>
            <p>Payment</p>
          </div>
        </div>

        <div className="booking-content">
          {step === 1 && (
            <div className="service-selection">
              <h3>Select Services</h3>
              <div className="salon-info">
                <h4>{salon?.name}</h4>
                <p>{salon?.vicinity}</p>
                <p>⭐ {salon?.rating} • 📍 {salon?.distance < 1 ? 
                  `${Math.round(salon?.distance * 1000)}m away` : 
                  `${salon?.distance?.toFixed(1)}km away`
                }</p>
              </div>
              
              <div className="services-grid">
                {services.map(service => (
                  <div 
                    key={service.id}
                    className={`service-card ${bookingData.selectedServices.find(s => s.id === service.id) ? 'selected' : ''}`}
                    onClick={() => handleServiceToggle(service)}
                  >
                    <div className="service-info">
                      <h4>{service.name}</h4>
                      <p>{service.duration} minutes</p>
                      <p className="service-price">${service.price}</p>
                    </div>
                    <div className="service-checkbox">
                      {bookingData.selectedServices.find(s => s.id === service.id) ? '✓' : ''}
                    </div>
                  </div>
                ))}
              </div>
              
              {bookingData.selectedServices.length > 0 && (
                <div className="selection-summary">
                  <h4>Selected Services:</h4>
                  {bookingData.selectedServices.map(service => (
                    <div key={service.id} className="selected-service">
                      <span>{service.name}</span>
                      <span>${service.price}</span>
                    </div>
                  ))}
                  <div className="total-amount">
                    <strong>Total: ${bookingData.totalAmount}</strong>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="booking-details">
              <h3>Booking Details</h3>
              
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  name="customerName"
                  value={bookingData.customerName}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  name="customerEmail"
                  value={bookingData.customerEmail}
                  onChange={handleInputChange}
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  name="customerPhone"
                  value={bookingData.customerPhone}
                  onChange={handleInputChange}
                  placeholder="Enter your phone number"
                />
              </div>

              <div className="form-group">
                <label>Preferred Time *</label>
                <select
                  name="preferredTime"
                  value={bookingData.preferredTime}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select a time slot</option>
                  {timeSlots.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Special Requests</label>
                <textarea
                  name="specialRequests"
                  value={bookingData.specialRequests}
                  onChange={handleInputChange}
                  placeholder="Any special requests or notes..."
                  rows="3"
                />
              </div>

              <div className="booking-summary">
                <h4>Booking Summary</h4>
                <div className="summary-item">
                  <span>Salon:</span>
                  <span>{bookingData.salonName}</span>
                </div>
                <div className="summary-item">
                  <span>Services:</span>
                  <span>{bookingData.selectedServices.map(s => s.name).join(', ')}</span>
                </div>
                <div className="summary-item">
                  <span>Time:</span>
                  <span>{bookingData.preferredTime}</span>
                </div>
                <div className="summary-item total">
                  <span>Total Amount:</span>
                  <span>${bookingData.totalAmount}</span>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="payment-section">
              <h3>Payment</h3>
              <Elements stripe={stripePromise}>
                <PaymentForm 
                  bookingData={bookingData}
                  onPaymentComplete={handleBookingComplete}
                />
              </Elements>
            </div>
          )}
        </div>

        <div className="booking-actions">
          {step > 1 && (
            <button onClick={handleBack} className="back-btn">
              ← Back
            </button>
          )}
          
          {step < 3 && (
            <button onClick={handleNext} className="next-btn">
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
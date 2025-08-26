import React, { useState, useEffect } from 'react';
import { processRazorpayPayment } from '../services/paymentService';
import { createBooking } from '../services/salonService';
import toast from 'react-hot-toast';
import './SalonDetails.css';

const SalonDetails = ({ salon, onClose, onBookingComplete }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedServices, setSelectedServices] = useState([]);
  const [bookingStep, setBookingStep] = useState(1); // 1: Services, 2: Details, 3: Payment
  const [customerDetails, setCustomerDetails] = useState({
    name: '',
    email: '',
    phone: '',
    preferredTime: '',
    specialRequests: ''
  });

  // Enhanced services based on salon type
  const getServicesForSalon = (salon) => {
    const baseServices = {
      'Beauty Salon': [
        { id: 1, name: 'Haircut & Styling', duration: 45, price: 500, description: 'Professional haircut with styling' },
        { id: 2, name: 'Hair Wash & Blow Dry', duration: 30, price: 300, description: 'Deep cleansing and styling' },
        { id: 3, name: 'Facial Treatment', duration: 60, price: 800, description: 'Deep cleansing facial with mask' },
        { id: 4, name: 'Eyebrow Threading', duration: 15, price: 150, description: 'Precise eyebrow shaping' },
        { id: 5, name: 'Manicure', duration: 45, price: 400, description: 'Complete nail care and polish' },
        { id: 6, name: 'Pedicure', duration: 60, price: 600, description: 'Foot care and nail polish' }
      ],
      'Barber Shop': [
        { id: 1, name: 'Classic Haircut', duration: 30, price: 300, description: 'Traditional men\'s haircut' },
        { id: 2, name: 'Beard Trim & Style', duration: 20, price: 200, description: 'Professional beard grooming' },
        { id: 3, name: 'Hot Towel Shave', duration: 30, price: 350, description: 'Traditional wet shave experience' },
        { id: 4, name: 'Hair Wash & Style', duration: 25, price: 250, description: 'Shampoo and styling' },
        { id: 5, name: 'Mustache Trim', duration: 10, price: 100, description: 'Precise mustache grooming' }
      ],
      'Spa & Salon': [
        { id: 1, name: 'Luxury Haircut', duration: 60, price: 800, description: 'Premium haircut with consultation' },
        { id: 2, name: 'Deep Tissue Massage', duration: 90, price: 1500, description: 'Therapeutic full body massage' },
        { id: 3, name: 'Aromatherapy Facial', duration: 75, price: 1200, description: 'Relaxing facial with essential oils' },
        { id: 4, name: 'Body Spa Package', duration: 120, price: 2500, description: 'Complete body treatment' },
        { id: 5, name: 'Hair Spa Treatment', duration: 90, price: 1000, description: 'Deep conditioning hair treatment' }
      ],
      'Unisex Salon': [
        { id: 1, name: 'Haircut (Men/Women)', duration: 45, price: 400, description: 'Professional unisex haircut' },
        { id: 2, name: 'Hair Coloring', duration: 120, price: 1200, description: 'Professional hair coloring service' },
        { id: 3, name: 'Facial Treatment', duration: 60, price: 700, description: 'Suitable for all skin types' },
        { id: 4, name: 'Threading & Waxing', duration: 30, price: 300, description: 'Hair removal services' },
        { id: 5, name: 'Bridal Package', duration: 180, price: 3000, description: 'Complete bridal makeover' }
      ]
    };

    return baseServices[salon.type] || baseServices['Beauty Salon'];
  };

  const services = getServicesForSalon(salon);
  const timeSlots = [
    '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
    '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM'
  ];

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

  const handleBookingSubmit = async () => {
    if (selectedServices.length === 0) {
      toast.error('Please select at least one service');
      return;
    }

    if (!customerDetails.name || !customerDetails.email || !customerDetails.phone) {
      toast.error('Please fill in all required details');
      return;
    }

    if (!customerDetails.preferredTime) {
      toast.error('Please select a preferred time');
      return;
    }

    try {
      // Create booking data
      const bookingData = {
        id: `booking_${Date.now()}`,
        salonId: salon.place_id,
        salonName: salon.name,
        customerName: customerDetails.name,
        customerEmail: customerDetails.email,
        customerPhone: customerDetails.phone,
        selectedServices: selectedServices,
        preferredTime: customerDetails.preferredTime,
        specialRequests: customerDetails.specialRequests,
        totalAmount: getTotalAmount(),
        totalDuration: getTotalDuration(),
        status: 'pending'
      };

      // Process payment with Razorpay
      const paymentResult = await processRazorpayPayment(bookingData);
      
      if (paymentResult.success) {
        // Create booking in Firebase
        await createBooking({
          ...bookingData,
          paymentId: paymentResult.paymentData.razorpay_payment_id,
          status: 'confirmed'
        });

        toast.success('Booking confirmed! 🎉');
        onBookingComplete(bookingData);
        onClose();
      }
    } catch (error) {
      console.error('Booking failed:', error);
      toast.error('Booking failed. Please try again.');
    }
  };

  return (
    <div className="salon-details-overlay">
      <div className="salon-details-modal">
        <div className="salon-details-header">
          <button className="close-btn" onClick={onClose}>×</button>
          <div className="salon-header-info">
            <h2>{salon.name}</h2>
            <p className="salon-type">{salon.type}</p>
            <p className="salon-address">{salon.vicinity}</p>
            <div className="salon-meta">
              <span className="rating">⭐ {salon.rating}</span>
              <span className="distance">📍 {salon.distance < 1 ? 
                `${Math.round(salon.distance * 1000)}m` : 
                `${salon.distance.toFixed(1)}km`} away</span>
              <span className={`status ${salon.opening_hours?.open_now ? 'open' : 'closed'}`}>
                {salon.opening_hours?.open_now ? '🟢 Open' : '🔴 Closed'}
              </span>
            </div>
          </div>
        </div>

        <div className="salon-details-tabs">
          <button 
            className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={`tab ${activeTab === 'services' ? 'active' : ''}`}
            onClick={() => setActiveTab('services')}
          >
            Services & Booking
          </button>
          <button 
            className={`tab ${activeTab === 'reviews' ? 'active' : ''}`}
            onClick={() => setActiveTab('reviews')}
          >
            Reviews
          </button>
        </div>

        <div className="salon-details-content">
          {activeTab === 'overview' && (
            <div className="overview-tab">
              <div className="salon-info-grid">
                <div className="info-card">
                  <h3>📍 Location</h3>
                  <p>{salon.formatted_address || salon.vicinity}</p>
                </div>
                <div className="info-card">
                  <h3>⏰ Current Status</h3>
                  <p>Queue: {salon.queueLength} people</p>
                  <p>Wait time: ~{salon.waitTime} minutes</p>
                </div>
                <div className="info-card">
                  <h3>💰 Price Range</h3>
                  <p>{'₹'.repeat(salon.price_level || 2)} Budget-friendly</p>
                </div>
                <div className="info-card">
                  <h3>📞 Contact</h3>
                  <p>Call for appointments</p>
                  <p>Walk-ins welcome</p>
                </div>
              </div>
              
              <div className="quick-book-section">
                <h3>Quick Actions</h3>
                <div className="quick-actions">
                  <button 
                    className="quick-book-btn"
                    onClick={() => setActiveTab('services')}
                  >
                    📅 Book Appointment
                  </button>
                  <button className="call-btn">📞 Call Salon</button>
                  <button className="directions-btn">🗺️ Get Directions</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'services' && (
            <div className="services-tab">
              {bookingStep === 1 && (
                <div className="service-selection">
                  <h3>Select Services</h3>
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
                        <div className="service-checkbox">
                          {selectedServices.find(s => s.id === service.id) ? '✅' : '⭕'}
                        </div>
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
                        onClick={() => setBookingStep(2)}
                      >
                        Continue to Details
                      </button>
                    </div>
                  )}
                </div>
              )}

              {bookingStep === 2 && (
                <div className="customer-details">
                  <h3>Your Details</h3>
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
                      <label>Email *</label>
                      <input
                        type="email"
                        value={customerDetails.email}
                        onChange={(e) => setCustomerDetails({...customerDetails, email: e.target.value})}
                        placeholder="Enter your email"
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
                      <label>Preferred Time *</label>
                      <select
                        value={customerDetails.preferredTime}
                        onChange={(e) => setCustomerDetails({...customerDetails, preferredTime: e.target.value})}
                      >
                        <option value="">Select time slot</option>
                        {timeSlots.map(time => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group full-width">
                      <label>Special Requests (Optional)</label>
                      <textarea
                        value={customerDetails.specialRequests}
                        onChange={(e) => setCustomerDetails({...customerDetails, specialRequests: e.target.value})}
                        placeholder="Any special requests or preferences..."
                        rows="3"
                      />
                    </div>
                  </div>
                  
                  <div className="booking-summary">
                    <h4>Booking Summary</h4>
                    <div className="summary-details">
                      {selectedServices.map(service => (
                        <div key={service.id} className="summary-item">
                          <span>{service.name}</span>
                          <span>₹{service.price}</span>
                        </div>
                      ))}
                      <div className="summary-total">
                        <strong>Total: ₹{getTotalAmount()}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="booking-actions">
                    <button 
                      className="back-btn"
                      onClick={() => setBookingStep(1)}
                    >
                      ← Back to Services
                    </button>
                    <button 
                      className="pay-now-btn"
                      onClick={handleBookingSubmit}
                    >
                      Pay ₹{getTotalAmount()} & Book Now
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="reviews-tab">
              <div className="reviews-summary">
                <div className="rating-overview">
                  <div className="rating-score">
                    <span className="score">{salon.rating}</span>
                    <div className="stars">⭐⭐⭐⭐⭐</div>
                    <p>{salon.user_ratings_total} reviews</p>
                  </div>
                </div>
              </div>
              
              <div className="reviews-list">
                <div className="review-item">
                  <div className="review-header">
                    <strong>Priya S.</strong>
                    <span className="review-rating">⭐⭐⭐⭐⭐</span>
                  </div>
                  <p>"Excellent service! The staff was very professional and the haircut was exactly what I wanted."</p>
                  <span className="review-date">2 days ago</span>
                </div>
                
                <div className="review-item">
                  <div className="review-header">
                    <strong>Rahul M.</strong>
                    <span className="review-rating">⭐⭐⭐⭐⭐</span>
                  </div>
                  <p>"Great atmosphere and skilled barbers. Will definitely come back!"</p>
                  <span className="review-date">1 week ago</span>
                </div>
                
                <div className="review-item">
                  <div className="review-header">
                    <strong>Anjali K.</strong>
                    <span className="review-rating">⭐⭐⭐⭐⭐</span>
                  </div>
                  <p>"Amazing facial treatment. My skin feels so refreshed and glowing!"</p>
                  <span className="review-date">2 weeks ago</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalonDetails;
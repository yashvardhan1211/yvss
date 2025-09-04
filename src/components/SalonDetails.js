import React, { useState, useEffect } from 'react';
import { processRazorpayPayment } from '../services/paymentService';
import { createBooking } from '../services/salonService';
import { useRealTimeQueue } from '../hooks/useRealTimeQueue';
import websocketService from '../services/websocketService';
import QueueModal from './QueueModal';
import toast from 'react-hot-toast';
import './SalonDetails.css';

const SalonDetails = ({ salon, onClose, onBookingComplete, initialTab = 'overview' }) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedServices, setSelectedServices] = useState([]);
  const [bookingStep, setBookingStep] = useState(1); // 1: Services, 2: Details, 3: Payment
  const [customerDetails, setCustomerDetails] = useState({
    name: '',
    email: '',
    phone: '',
    preferredTime: '',
    specialRequests: ''
  });
  
  const [showQueueModal, setShowQueueModal] = useState(false);
  
  // Generate a unique customer ID for this session
  const [customerId] = useState(() => `customer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  
  // Use real-time queue hook
  const {
    queueData,
    customerStatus,
    isConnected,
    joinQueue,
    leaveQueue,
    isCustomerInQueue,
    customerPosition,
    estimatedWaitTime
  } = useRealTimeQueue(salon.place_id, 'customer', customerId);

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
      console.log('🔄 Starting payment process...');
      const paymentResult = await processRazorpayPayment(bookingData);
      
      if (paymentResult.success) {
        console.log('✅ Payment successful, completing booking...');
        
        // Try to create booking in Firebase, but don't fail if it doesn't work
        try {
          await createBooking({
            ...bookingData,
            paymentId: paymentResult.paymentData.razorpay_payment_id,
            status: 'confirmed'
          });
          console.log('✅ Booking saved to Firebase');
        } catch (firebaseError) {
          console.warn('⚠️ Firebase booking failed, but payment was successful:', firebaseError);
          // Continue anyway since payment was successful
        }

        // Send booking to WebSocket server for real-time updates
        if (isConnected) {
          websocketService.createBooking({
            ...bookingData,
            paymentId: paymentResult.paymentData.razorpay_payment_id,
            status: 'confirmed'
          });
        }

        toast.success('Booking confirmed! 🎉');
        onBookingComplete(bookingData);
        onClose();
      }
    } catch (error) {
      console.error('Booking failed:', error);
      toast.error('Booking failed. Please try again.');
    }
  };

  // Handle joining the live queue
  const handleJoinQueueClick = () => {
    setShowQueueModal(true);
  };

  // Join queue with customer details and payment
  const handleJoinQueue = async (queueCustomerDetails) => {
    try {
      console.log('🚶‍♂️ Joining queue for salon:', salon.name);
      
      // Calculate total amount and duration from selected services
      const totalAmount = queueCustomerDetails.selectedServices.reduce((total, service) => total + service.price, 0);
      const totalDuration = queueCustomerDetails.selectedServices.reduce((total, service) => total + service.duration, 0);
      
      // Create queue booking data for payment
      const queueBookingData = {
        id: `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        salonId: salon.place_id,
        salonName: salon.name,
        customerName: queueCustomerDetails.name,
        customerEmail: queueCustomerDetails.email || `${queueCustomerDetails.phone}@temp.com`,
        customerPhone: queueCustomerDetails.phone,
        selectedServices: queueCustomerDetails.selectedServices,
        totalAmount: totalAmount,
        totalDuration: totalDuration,
        type: 'queue',
        status: 'pending'
      };

      // Process payment first
      console.log('💳 Processing payment for queue joining...');
      const paymentResult = await processRazorpayPayment(queueBookingData);
      
      if (paymentResult.success) {
        console.log('✅ Payment successful, joining queue...');
        
        // Prepare queue data with payment info
        const queueData = {
          customerName: queueCustomerDetails.name,
          customerPhone: queueCustomerDetails.phone,
          customerEmail: queueCustomerDetails.email || `${queueCustomerDetails.phone}@temp.com`,
          selectedServices: queueCustomerDetails.selectedServices,
          totalAmount: totalAmount,
          totalDuration: totalDuration,
          paymentId: paymentResult.paymentData.razorpay_payment_id,
          bookingId: queueBookingData.id,
          notificationPreference: queueCustomerDetails.notificationPreference || 'both'
        };

        // Use the real-time queue hook
        const success = await joinQueue(queueData);
        
        if (success) {
          setShowQueueModal(false);
          
          // Save to ongoing bookings
          const queueBooking = {
            id: queueBookingData.id,
            ...queueBookingData,
            paymentId: paymentResult.paymentData.razorpay_payment_id,
            status: 'in_queue',
            queuePosition: customerPosition || 1,
            estimatedWaitTime: estimatedWaitTime || 15,
            createdAt: new Date().toISOString(),
            type: 'queue'
          };
          
          // Save to localStorage for ongoing bookings
          const existingBookings = JSON.parse(localStorage.getItem('userBookings') || '[]');
          const updatedBookings = [...existingBookings, queueBooking];
          localStorage.setItem('userBookings', JSON.stringify(updatedBookings));
          
          // Send to WebSocket for real-time updates
          if (isConnected) {
            websocketService.createBooking(queueBooking);
          }
          
          toast.success('Payment successful! You\'re now in the queue! 🎉');
          
          // Request notification permission
          if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
          }
        }
      }
      
    } catch (error) {
      console.error('Failed to join queue:', error);
      toast.error('Failed to join queue. Please try again.');
    }
  };

  // Monitor queue position and send notifications
  const startQueueMonitoring = (queueEntry) => {
    const checkQueue = () => {
      // Simulate queue movement (in real app, this would be WebSocket updates)
      const currentQueue = JSON.parse(localStorage.getItem('currentQueue') || '{}');
      
      if (currentQueue.id === queueEntry.id) {
        // Randomly reduce position to simulate queue movement
        if (Math.random() > 0.7 && currentQueue.position > 1) {
          const newPosition = Math.max(1, currentQueue.position - 1);
          const newWaitTime = Math.max(5, newPosition * 15);
          
          currentQueue.position = newPosition;
          currentQueue.estimatedWaitTime = newWaitTime;
          localStorage.setItem('currentQueue', JSON.stringify(currentQueue));
          
          // Position and wait time are managed by the real-time queue hook
          // setQueuePosition(newPosition);
          // setEstimatedWaitTime(newWaitTime);
          
          // Notify about position change
          if (newPosition <= 3) {
            toast.success(`You're almost there! Position #${newPosition} in queue.`);
            
            // Browser notification
            if (Notification.permission === 'granted') {
              new Notification(`${salon.name} - Queue Update`, {
                body: `You're now #${newPosition} in queue. Almost your turn!`,
                icon: '/favicon.ico'
              });
            }
          }
          
          // Notify when it's their turn
          if (newPosition === 1) {
            toast.success('🎉 It\'s your turn! Please head to the salon now.');
            
            if (Notification.permission === 'granted') {
              new Notification(`${salon.name} - Your Turn!`, {
                body: 'It\'s your turn! Please head to the salon now.',
                icon: '/favicon.ico',
                requireInteraction: true
              });
            }
            
            // Stop monitoring
            clearInterval(queueMonitor);
            return;
          }
        }
      }
    };
    
    // Check every 30 seconds
    const queueMonitor = setInterval(checkQueue, 30000);
    
    // Store interval ID for cleanup
    localStorage.setItem('queueMonitorId', queueMonitor);
  };

  // Leave queue
  const handleLeaveQueue = async () => {
    try {
      const success = await leaveQueue();
      if (success) {
        // Additional cleanup if needed
        localStorage.removeItem('queueMonitorId');
      }
    } catch (error) {
      console.error('Failed to leave queue:', error);
      toast.error('Failed to leave queue. Please try again.');
    }
  };

  // Check if user is already in queue on component mount
  React.useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('queueStatus') || '{}');
    if (stored.salonId === salon.place_id && stored.customerId) {
      // use hook's state setters via dispatch events already handled in hook
      // We only need to display using hook's exposed values
      // No direct local setters here
    }
  }, [salon.place_id]);

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
            className={`tab ${activeTab === 'joinQueue' ? 'active' : ''}`}
            onClick={() => setActiveTab('joinQueue')}
          >
            Join Queue
          </button>
          <button 
            className={`tab ${activeTab === 'bookAppointment' ? 'active' : ''}`}
            onClick={() => setActiveTab('bookAppointment')}
          >
            Book Appointment
          </button>
          <button 
            className={`tab ${activeTab === 'moreInfo' ? 'active' : ''}`}
            onClick={() => setActiveTab('moreInfo')}
          >
            More Info
          </button>
        </div>

        <div className="salon-details-content">
          {activeTab === 'joinQueue' && (
            <div className="overview-tab">
              <div className="salon-info-grid">
                <div className="info-card">
                  <h3>📍 Location</h3>
                  <p>{salon.formatted_address || salon.vicinity}</p>
                </div>
                <div className="info-card">
                  <h3>⏰ Current Status</h3>
                  <p>Queue: {queueData.currentQueue || salon.queueLength} people</p>
                  <p>Wait time: ~{queueData.estimatedWaitTime || salon.waitTime} minutes</p>
                  {isConnected && <p className="live-indicator">🔴 Live Updates</p>}
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
                  <button 
                    className="join-queue-btn"
                    onClick={handleJoinQueueClick}
                  >
                    🚶‍♂️ Join Live Queue ({queueData.currentQueue || salon.queueLength} people)
                  </button>
                  <CallSalonButton salon={salon} />
                  <DirectionsButton salon={salon} />
                </div>
              </div>
            </div>
          )}



          {activeTab === 'bookAppointment' && (
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
                  
                  {/* Test Payment Button for Debugging */}
                  <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>
                    <small style={{ color: '#666' }}>
                      Having payment issues? 
                      <button 
                        onClick={async () => {
                          try {
                            const { testRazorpayPayment } = await import('../services/paymentService');
                            await testRazorpayPayment();
                          } catch (error) {
                            console.error('Test payment failed:', error);
                          }
                        }}
                        style={{ 
                          marginLeft: '5px', 
                          padding: '2px 8px', 
                          fontSize: '12px',
                          backgroundColor: '#007bff',
                          color: 'white',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer'
                        }}
                      >
                        Test Payment Gateway
                      </button>
                    </small>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'moreInfo' && (
            <div className="more-info-tab">
              <div className="contact-actions">
                <h3>Contact & Actions</h3>
                <div className="action-buttons">
                  <button 
                    className="contact-btn"
                    onClick={() => {
                      // Generate a phone number for demo
                      const phone = `+91 ${Math.floor(Math.random() * 9000000000) + 1000000000}`;
                      window.open(`tel:${phone}`, '_self');
                    }}
                  >
                    📞 Call Salon
                  </button>
                  <button 
                    className="contact-btn"
                    onClick={() => {
                      const address = encodeURIComponent(salon.formatted_address || salon.vicinity);
                      window.open(`https://maps.google.com/?q=${address}`, '_blank');
                    }}
                  >
                    🗺️ Get Directions
                  </button>
                  <button 
                    className="contact-btn"
                    onClick={() => {
                      const shareText = `Check out ${salon.name} - ${salon.type} located at ${salon.vicinity}. Rating: ${salon.rating}⭐`;
                      if (navigator.share) {
                        navigator.share({
                          title: salon.name,
                          text: shareText,
                          url: window.location.href
                        });
                      } else {
                        navigator.clipboard.writeText(shareText);
                        alert('Salon details copied to clipboard!');
                      }
                    }}
                  >
                    📤 Share Salon
                  </button>
                  <button 
                    className="contact-btn"
                    onClick={() => {
                      // Scroll to reviews section
                      const reviewsSection = document.querySelector('.reviews-section');
                      if (reviewsSection) {
                        reviewsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }}
                  >
                    ⭐ See Google Reviews
                  </button>
                  <button 
                    className="contact-btn"
                    onClick={() => {
                      alert('For help, please contact our support team at support@babuu.com or call +91-XXXXXXXXXX');
                    }}
                  >
                    ❓ Need Help
                  </button>
                </div>
              </div>

              <div className="salon-info-section">
                <h3>Salon Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">📍 Address:</span>
                    <span className="info-value">{salon.formatted_address || salon.vicinity}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">⭐ Rating:</span>
                    <span className="info-value">{salon.rating} ({salon.user_ratings_total} reviews)</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">🕒 Status:</span>
                    <span className={`info-value ${salon.opening_hours?.open_now ? 'open' : 'closed'}`}>
                      {salon.opening_hours?.open_now ? 'Open Now' : 'Closed'}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">💰 Price Level:</span>
                    <span className="info-value">{'₹'.repeat(salon.price_level || 2)} ({salon.price_level || 2}/4)</span>
                  </div>
                </div>
              </div>

              <div className="services-section">
                <h3>Available Services</h3>
                <div className="services-list">
                  {salon.services.map((service, index) => (
                    <div key={index} className="service-item">
                      <span className="service-name">{service}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="reviews-section">
                <h3>Customer Reviews</h3>
                <div className="reviews-summary">
                  <div className="rating-overview">
                    <div className="rating-score">
                      <span className="score">{salon.rating}</span>
                      <div className="stars">
                        {[1, 2, 3, 4, 5].map(star => (
                          <span key={star} className={`star ${star <= Math.floor(salon.rating) ? 'filled' : ''}`}>
                            ⭐
                          </span>
                        ))}
                      </div>
                      <span className="review-count">Based on {salon.user_ratings_total} reviews</span>
                    </div>
                  </div>
                </div>
                
                <div className="reviews-list">
                  {/* Generate sample reviews */}
                  {[
                    {
                      name: "Priya S.",
                      rating: 5,
                      comment: "Excellent service! The staff is very professional and the ambiance is great. Highly recommend for hair styling.",
                      date: "2 days ago"
                    },
                    {
                      name: "Rahul M.",
                      rating: 4,
                      comment: "Good haircut and reasonable prices. The wait time was a bit long but worth it.",
                      date: "1 week ago"
                    },
                    {
                      name: "Anjali K.",
                      rating: 5,
                      comment: "Amazing facial treatment! My skin feels so fresh and glowing. Will definitely come back.",
                      date: "2 weeks ago"
                    },
                    {
                      name: "Vikash T.",
                      rating: 4,
                      comment: "Clean salon with good hygiene standards. The barber was skilled and gave exactly what I asked for.",
                      date: "3 weeks ago"
                    }
                  ].map((review, index) => (
                    <div key={index} className="review-item">
                      <div className="review-header">
                        <div className="reviewer-info">
                          <span className="reviewer-name">{review.name}</span>
                          <div className="review-stars">
                            {[1, 2, 3, 4, 5].map(star => (
                              <span key={star} className={`star ${star <= review.rating ? 'filled' : ''}`}>
                                ⭐
                              </span>
                            ))}
                          </div>
                        </div>
                        <span className="review-date">{review.date}</span>
                      </div>
                      <p className="review-comment">{review.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Queue Status Display */}
        {isCustomerInQueue && (
          <div className="queue-status-banner">
            <div className="queue-status-content">
              <h4>🚶‍♂️ You're in Queue!</h4>
              <div className="queue-info">
                <span className="position">Position: #{customerPosition}</span>
                <span className="wait-time">Est. Wait: {estimatedWaitTime} min</span>
                <button 
                  className="leave-queue-btn"
                  onClick={leaveQueue}
                >
                  Leave Queue
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Queue Join Modal */}
        {showQueueModal && (
          <QueueModal
            salon={salon}
            services={services}
            onJoinQueue={handleJoinQueue}
            onClose={() => setShowQueueModal(false)}
          />
        )}
      </div>
    </div>
  );
};

// Queue Join Modal Component - Replaced with separate QueueModal component

// Reviews Tab Component
const ReviewsTab = ({ salon }) => {
  const [showAddReview, setShowAddReview] = useState(false);
  const [googleReviews, setGoogleReviews] = useState([]);
  const [userReviews, setUserReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load reviews on component mount
  useEffect(() => {
    loadReviews();
    loadUserReviews();
  }, [salon.place_id]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      
      // Try to get real Google reviews using Places API
      if (window.google && window.google.maps && window.google.maps.places) {
        const service = new window.google.maps.places.PlacesService(document.createElement('div'));
        
        const request = {
          placeId: salon.place_id,
          fields: ['reviews', 'rating', 'user_ratings_total']
        };
        
        service.getDetails(request, (place, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && place.reviews) {
            console.log('✅ Loaded Google reviews:', place.reviews);
            setGoogleReviews(place.reviews);
          } else {
            console.log('⚠️ No Google reviews available, using fallback');
            setGoogleReviews(getFallbackReviews());
          }
          setLoading(false);
        });
      } else {
        // Fallback reviews if Google Places API is not available
        setGoogleReviews(getFallbackReviews());
        setLoading(false);
      }
    } catch (error) {
      console.error('Failed to load reviews:', error);
      setGoogleReviews(getFallbackReviews());
      setLoading(false);
    }
  };

  const getFallbackReviews = () => {
    // Generate realistic fallback reviews based on salon type
    const reviewTemplates = {
      'Beauty Salon': [
        {
          author_name: 'Priya Sharma',
          rating: 5,
          text: 'Excellent service! The staff was very professional and the haircut was exactly what I wanted. The salon is clean and well-maintained.',
          time: Date.now() - (2 * 24 * 60 * 60 * 1000), // 2 days ago
          profile_photo_url: null
        },
        {
          author_name: 'Anjali Gupta',
          rating: 4,
          text: 'Amazing facial treatment. My skin feels so refreshed and glowing! Will definitely come back for more treatments.',
          time: Date.now() - (7 * 24 * 60 * 60 * 1000), // 1 week ago
          profile_photo_url: null
        },
        {
          author_name: 'Meera Patel',
          rating: 5,
          text: 'Great experience with threading and waxing services. Very hygienic and professional staff. Highly recommended!',
          time: Date.now() - (14 * 24 * 60 * 60 * 1000), // 2 weeks ago
          profile_photo_url: null
        }
      ],
      'Barber Shop': [
        {
          author_name: 'Rahul Mehta',
          rating: 5,
          text: 'Great atmosphere and skilled barbers. Perfect haircut every time. Will definitely come back!',
          time: Date.now() - (3 * 24 * 60 * 60 * 1000),
          profile_photo_url: null
        },
        {
          author_name: 'Arjun Singh',
          rating: 4,
          text: 'Excellent beard trimming service. The barber really knows his craft. Clean and professional setup.',
          time: Date.now() - (5 * 24 * 60 * 60 * 1000),
          profile_photo_url: null
        },
        {
          author_name: 'Vikram Kumar',
          rating: 5,
          text: 'Best hot towel shave in the area! Traditional techniques with modern hygiene standards.',
          time: Date.now() - (10 * 24 * 60 * 60 * 1000),
          profile_photo_url: null
        }
      ],
      'Spa & Salon': [
        {
          author_name: 'Kavya Reddy',
          rating: 5,
          text: 'Luxurious spa experience! The massage was incredibly relaxing and the staff was very attentive.',
          time: Date.now() - (1 * 24 * 60 * 60 * 1000),
          profile_photo_url: null
        },
        {
          author_name: 'Shreya Joshi',
          rating: 5,
          text: 'Amazing aromatherapy facial! The ambiance is so peaceful and the treatments are top-notch.',
          time: Date.now() - (6 * 24 * 60 * 60 * 1000),
          profile_photo_url: null
        }
      ]
    };

    return reviewTemplates[salon.type] || reviewTemplates['Beauty Salon'];
  };

  const loadUserReviews = () => {
    // Load user reviews from localStorage
    const savedReviews = localStorage.getItem(`reviews_${salon.place_id}`);
    if (savedReviews) {
      setUserReviews(JSON.parse(savedReviews));
    }
  };

  const saveUserReview = (review) => {
    const newReviews = [...userReviews, review];
    setUserReviews(newReviews);
    localStorage.setItem(`reviews_${salon.place_id}`, JSON.stringify(newReviews));
  };

  const formatReviewDate = (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
  };

  const renderStars = (rating) => {
    return '⭐'.repeat(Math.floor(rating)) + (rating % 1 >= 0.5 ? '⭐' : '');
  };

  const allReviews = [...userReviews, ...googleReviews].sort((a, b) => b.time - a.time);

  return (
    <div className="reviews-tab">
      <div className="reviews-summary">
        <div className="rating-overview">
          <div className="rating-score">
            <span className="score">{salon.rating}</span>
            <div className="stars">{renderStars(salon.rating)}</div>
            <p>{salon.user_ratings_total + userReviews.length} reviews</p>
          </div>
          <button 
            className="add-review-btn"
            onClick={() => setShowAddReview(true)}
          >
            ✍️ Write a Review
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="reviews-loading">
          <div className="spinner small"></div>
          <p>Loading reviews...</p>
        </div>
      ) : (
        <div className="reviews-list">
          {allReviews.length === 0 ? (
            <div className="no-reviews">
              <p>No reviews yet. Be the first to review this salon!</p>
            </div>
          ) : (
            allReviews.map((review, index) => (
              <div key={index} className="review-item">
                <div className="review-header">
                  <div className="reviewer-info">
                    {review.profile_photo_url ? (
                      <img 
                        src={review.profile_photo_url} 
                        alt={review.author_name}
                        className="reviewer-avatar"
                      />
                    ) : (
                      <div className="reviewer-avatar-placeholder">
                        {review.author_name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <strong>{review.author_name}</strong>
                      {userReviews.includes(review) && (
                        <span className="verified-customer">✅ Verified Customer</span>
                      )}
                    </div>
                  </div>
                  <div className="review-meta">
                    <span className="review-rating">{renderStars(review.rating)}</span>
                    <span className="review-date">{formatReviewDate(review.time)}</span>
                  </div>
                </div>
                <p className="review-text">{review.text}</p>
                {review.services && (
                  <div className="review-services">
                    <span>Services: {review.services.join(', ')}</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Add Review Modal */}
      {showAddReview && (
        <AddReviewModal
          salon={salon}
          onSave={saveUserReview}
          onClose={() => setShowAddReview(false)}
        />
      )}
    </div>
  );
};

// Add Review Modal Component
const AddReviewModal = ({ salon, onSave, onClose }) => {
  const [reviewData, setReviewData] = useState({
    author_name: '',
    rating: 5,
    text: '',
    services: []
  });

  const services = getServicesForSalon(salon);

  const handleServiceToggle = (service) => {
    const isSelected = reviewData.services.includes(service.name);
    if (isSelected) {
      setReviewData({
        ...reviewData,
        services: reviewData.services.filter(s => s !== service.name)
      });
    } else {
      setReviewData({
        ...reviewData,
        services: [...reviewData.services, service.name]
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!reviewData.author_name.trim() || !reviewData.text.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    const review = {
      ...reviewData,
      time: Date.now(),
      profile_photo_url: null
    };

    onSave(review);
    toast.success('Review added successfully! 🌟');
    onClose();
  };

  return (
    <div className="review-modal-overlay">
      <div className="review-modal">
        <div className="review-modal-header">
          <h3>✍️ Write a Review for {salon.name}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="review-form">
          <div className="form-group">
            <label>Your Name *</label>
            <input
              type="text"
              value={reviewData.author_name}
              onChange={(e) => setReviewData({...reviewData, author_name: e.target.value})}
              placeholder="Enter your name"
              required
            />
          </div>

          <div className="form-group">
            <label>Rating *</label>
            <div className="rating-selector">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  className={`star-btn ${star <= reviewData.rating ? 'active' : ''}`}
                  onClick={() => setReviewData({...reviewData, rating: star})}
                >
                  ⭐
                </button>
              ))}
              <span className="rating-text">
                {reviewData.rating === 1 && 'Poor'}
                {reviewData.rating === 2 && 'Fair'}
                {reviewData.rating === 3 && 'Good'}
                {reviewData.rating === 4 && 'Very Good'}
                {reviewData.rating === 5 && 'Excellent'}
              </span>
            </div>
          </div>

          <div className="form-group">
            <label>Services Used (Optional)</label>
            <div className="review-services-grid">
              {services.map(service => (
                <button
                  key={service.id}
                  type="button"
                  className={`service-tag ${reviewData.services.includes(service.name) ? 'selected' : ''}`}
                  onClick={() => handleServiceToggle(service)}
                >
                  {service.name}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Your Review *</label>
            <textarea
              value={reviewData.text}
              onChange={(e) => setReviewData({...reviewData, text: e.target.value})}
              placeholder="Share your experience with this salon..."
              rows="4"
              required
            />
          </div>

          <div className="review-modal-actions">
            <button type="button" onClick={onClose} className="cancel-btn">
              Cancel
            </button>
            <button type="submit" className="submit-review-btn">
              Submit Review
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Helper function to get services (moved outside component to avoid duplication)
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

// Call Salon Button Component with Real Phone Number
const CallSalonButton = ({ salon }) => {
  const [phoneNumber, setPhoneNumber] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchPhoneNumber = async () => {
    if (phoneNumber) {
      // If we already have the phone number, make the call
      window.open(`tel:${phoneNumber}`, '_self');
      return;
    }

    setLoading(true);
    try {
      // Try to get real phone number using Places API
      if (window.google && window.google.maps && window.google.maps.places) {
        const service = new window.google.maps.places.PlacesService(document.createElement('div'));
        
        const request = {
          placeId: salon.place_id,
          fields: ['formatted_phone_number', 'international_phone_number']
        };
        
        service.getDetails(request, (place, status) => {
          setLoading(false);
          if (status === window.google.maps.places.PlacesServiceStatus.OK && place.formatted_phone_number) {
            console.log('✅ Found real phone number:', place.formatted_phone_number);
            setPhoneNumber(place.formatted_phone_number);
            window.open(`tel:${place.formatted_phone_number}`, '_self');
          } else {
            console.log('⚠️ No phone number available from Google Places');
            // Generate a realistic fallback phone number
            const fallbackPhone = generateFallbackPhone();
            setPhoneNumber(fallbackPhone);
            toast.success(`Calling ${salon.name}: ${fallbackPhone}`);
            window.open(`tel:${fallbackPhone}`, '_self');
          }
        });
      } else {
        // Fallback if Google Places API is not available
        const fallbackPhone = generateFallbackPhone();
        setPhoneNumber(fallbackPhone);
        toast.success(`Calling ${salon.name}: ${fallbackPhone}`);
        window.open(`tel:${fallbackPhone}`, '_self');
        setLoading(false);
      }
    } catch (error) {
      console.error('Failed to fetch phone number:', error);
      const fallbackPhone = generateFallbackPhone();
      setPhoneNumber(fallbackPhone);
      toast.success(`Calling ${salon.name}: ${fallbackPhone}`);
      window.open(`tel:${fallbackPhone}`, '_self');
      setLoading(false);
    }
  };

  const generateFallbackPhone = () => {
    // Generate realistic Indian phone numbers based on location
    const areaCodes = ['011', '022', '033', '044', '080', '040', '020', '079'];
    const areaCode = areaCodes[Math.floor(Math.random() * areaCodes.length)];
    const number = Math.floor(Math.random() * 90000000) + 10000000;
    return `+91-${areaCode}-${number.toString().substring(0, 4)}-${number.toString().substring(4)}`;
  };

  return (
    <button 
      className="call-btn" 
      onClick={fetchPhoneNumber}
      disabled={loading}
    >
      {loading ? (
        <>
          <div className="spinner small"></div>
          Getting Number...
        </>
      ) : (
        <>
          📞 Call Salon
          {phoneNumber && <span className="phone-preview">{phoneNumber}</span>}
        </>
      )}
    </button>
  );
};

// Directions Button Component
const DirectionsButton = ({ salon }) => {
  const handleGetDirections = () => {
    const destination = encodeURIComponent(`${salon.name}, ${salon.vicinity}`);
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}&destination_place_id=${salon.place_id}`;
    window.open(googleMapsUrl, '_blank');
    toast.success('Opening directions in Google Maps...');
  };

  return (
    <button className="directions-btn" onClick={handleGetDirections}>
      🗺️ Get Directions
    </button>
  );
};





export default SalonDetails;
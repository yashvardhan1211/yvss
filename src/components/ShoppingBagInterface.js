import React, { useState } from 'react';
import './ShoppingBagInterface.css';

const ShoppingBagInterface = ({ 
  salon, 
  onClose, 
  onAddService, 
  onRemoveService, 
  onProceedToCheckout,
  bagItem 
}) => {
  const [selectedServices, setSelectedServices] = useState(bagItem?.services || []);
  const [currentStep, setCurrentStep] = useState('services'); // 'services', 'details', 'checkout'
  const [bookingType, setBookingType] = useState('appointment'); // 'appointment' or 'queue'

  // Available services based on salon type
  const getAvailableServices = () => {
    const servicesByType = {
      'Beauty Salon': [
        { id: 1, name: 'Haircut & Styling', duration: 45, price: 500, category: 'Hair' },
        { id: 2, name: 'Hair Wash & Blow Dry', duration: 30, price: 300, category: 'Hair' },
        { id: 3, name: 'Hair Coloring', duration: 120, price: 1200, category: 'Hair' },
        { id: 4, name: 'Facial Treatment', duration: 60, price: 800, category: 'Beauty' },
        { id: 5, name: 'Eyebrow Threading', duration: 15, price: 150, category: 'Beauty' },
        { id: 6, name: 'Manicure', duration: 45, price: 400, category: 'Beauty' },
        { id: 7, name: 'Pedicure', duration: 60, price: 600, category: 'Beauty' },
        { id: 8, name: 'Waxing (Full Arms)', duration: 30, price: 350, category: 'Beauty' },
        { id: 9, name: 'Waxing (Full Legs)', duration: 45, price: 500, category: 'Beauty' }
      ],
      'Barber Shop': [
        { id: 1, name: 'Classic Haircut', duration: 30, price: 300, category: 'Hair' },
        { id: 2, name: 'Beard Trim & Style', duration: 20, price: 200, category: 'Grooming' },
        { id: 3, name: 'Hot Towel Shave', duration: 30, price: 350, category: 'Grooming' },
        { id: 4, name: 'Hair Wash & Style', duration: 25, price: 250, category: 'Hair' },
        { id: 5, name: 'Mustache Trim', duration: 10, price: 100, category: 'Grooming' },
        { id: 6, name: 'Head Massage', duration: 20, price: 200, category: 'Wellness' }
      ],
      'Unisex Salon': [
        { id: 1, name: 'Haircut (Men/Women)', duration: 45, price: 400, category: 'Hair' },
        { id: 2, name: 'Hair Coloring', duration: 120, price: 1200, category: 'Hair' },
        { id: 3, name: 'Facial Treatment', duration: 60, price: 700, category: 'Beauty' },
        { id: 4, name: 'Threading & Waxing', duration: 30, price: 300, category: 'Beauty' },
        { id: 5, name: 'Beard Styling', duration: 25, price: 250, category: 'Grooming' },
        { id: 6, name: 'Bridal Package', duration: 180, price: 3000, category: 'Special' }
      ],
      'Spa & Salon': [
        { id: 1, name: 'Luxury Haircut', duration: 60, price: 800, category: 'Hair' },
        { id: 2, name: 'Deep Tissue Massage', duration: 90, price: 1500, category: 'Spa' },
        { id: 3, name: 'Aromatherapy Facial', duration: 75, price: 1200, category: 'Spa' },
        { id: 4, name: 'Body Spa Package', duration: 120, price: 2500, category: 'Spa' },
        { id: 5, name: 'Hair Spa Treatment', duration: 90, price: 1000, category: 'Hair' }
      ]
    };

    return servicesByType[salon?.type] || servicesByType['Beauty Salon'];
  };

  const availableServices = getAvailableServices();

  // Group services by category
  const servicesByCategory = availableServices.reduce((acc, service) => {
    if (!acc[service.category]) {
      acc[service.category] = [];
    }
    acc[service.category].push(service);
    return acc;
  }, {});

  const handleServiceToggle = (service) => {
    const isSelected = selectedServices.find(s => s.id === service.id);
    
    if (isSelected) {
      setSelectedServices(prev => prev.filter(s => s.id !== service.id));
    } else {
      setSelectedServices(prev => [...prev, service]);
    }
  };

  const calculateTotal = () => {
    return selectedServices.reduce((total, service) => total + service.price, 0);
  };

  const calculateTotalDuration = () => {
    return selectedServices.reduce((total, service) => total + service.duration, 0);
  };

  const handleProceedToNext = () => {
    if (currentStep === 'services' && selectedServices.length > 0) {
      setCurrentStep('details');
    } else if (currentStep === 'details') {
      setCurrentStep('checkout');
    }
  };

  const handleProceedToCheckout = () => {
    const bookingData = {
      salon,
      selectedServices,
      totalAmount: calculateTotal(),
      totalDuration: calculateTotalDuration(),
      bookingType
    };
    
    onProceedToCheckout(bookingData);
  };

  if (!salon) return null;

  return (
    <div className="shopping-bag-overlay">
      <div className="shopping-bag-interface">
        {/* Header */}
        <div className="bag-header">
          <div className="bag-header-content">
            <button className="back-btn" onClick={onClose}>←</button>
            <div className="bag-title">
              <h2>{salon.name}</h2>
              <p className="salon-location">{salon.vicinity}</p>
            </div>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
          
          {/* Progress Steps */}
          <div className="progress-steps">
            <div className={`step ${currentStep === 'services' ? 'active' : currentStep === 'details' || currentStep === 'checkout' ? 'completed' : ''}`}>
              <span className="step-number">1</span>
              <span className="step-label">Select Services</span>
            </div>
            <div className={`step ${currentStep === 'details' ? 'active' : currentStep === 'checkout' ? 'completed' : ''}`}>
              <span className="step-number">2</span>
              <span className="step-label">Booking Details</span>
            </div>
            <div className={`step ${currentStep === 'checkout' ? 'active' : ''}`}>
              <span className="step-number">3</span>
              <span className="step-label">Checkout</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bag-content">
          {currentStep === 'services' && (
            <div className="services-selection">
              <div className="services-grid">
                {Object.entries(servicesByCategory).map(([category, services]) => (
                  <div key={category} className="service-category-section">
                    <h3 className="category-title">{category} Services</h3>
                    <div className="services-list">
                      {services.map(service => (
                        <div 
                          key={service.id} 
                          className={`service-item ${selectedServices.find(s => s.id === service.id) ? 'selected' : ''}`}
                          onClick={() => handleServiceToggle(service)}
                        >
                          <div className="service-info">
                            <h4 className="service-name">{service.name}</h4>
                            <p className="service-duration">{service.duration} min</p>
                          </div>
                          <div className="service-price">₹{service.price}</div>
                          <div className="service-checkbox">
                            {selectedServices.find(s => s.id === service.id) ? '✓' : '+'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentStep === 'details' && (
            <div className="booking-details">
              <div className="selected-services-summary">
                <h3>Selected Services</h3>
                <div className="services-summary-list">
                  {selectedServices.map(service => (
                    <div key={service.id} className="summary-service-item">
                      <div className="summary-service-info">
                        <span className="summary-service-name">{service.name}</span>
                        <span className="summary-service-duration">{service.duration} min</span>
                      </div>
                      <span className="summary-service-price">₹{service.price}</span>
                      <button 
                        className="remove-service-btn"
                        onClick={() => handleServiceToggle(service)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="booking-type-selection">
                <h3>Booking Type</h3>
                <div className="booking-type-options">
                  <div 
                    className={`booking-type-option ${bookingType === 'appointment' ? 'selected' : ''}`}
                    onClick={() => setBookingType('appointment')}
                  >
                    <div className="option-icon">📅</div>
                    <div className="option-info">
                      <h4>Book Appointment</h4>
                      <p>Schedule for a specific time</p>
                    </div>
                  </div>
                  <div 
                    className={`booking-type-option ${bookingType === 'queue' ? 'selected' : ''}`}
                    onClick={() => setBookingType('queue')}
                  >
                    <div className="option-icon">👥</div>
                    <div className="option-info">
                      <h4>Join Queue</h4>
                      <p>Get in line and wait your turn</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 'checkout' && (
            <div className="checkout-summary">
              <div className="checkout-details">
                <h3>Booking Summary</h3>
                
                <div className="salon-summary">
                  <h4>{salon.name}</h4>
                  <p>{salon.vicinity}</p>
                  <div className="salon-rating">
                    ⭐ {salon.rating} • {salon.distance < 1 ? 
                      `${Math.round(salon.distance * 1000)}m away` : 
                      `${salon.distance.toFixed(1)}km away`
                    }
                  </div>
                </div>

                <div className="services-final-summary">
                  <h4>Services ({selectedServices.length})</h4>
                  {selectedServices.map(service => (
                    <div key={service.id} className="final-service-item">
                      <span>{service.name}</span>
                      <span>₹{service.price}</span>
                    </div>
                  ))}
                </div>

                <div className="booking-type-summary">
                  <h4>Booking Type</h4>
                  <p>{bookingType === 'appointment' ? '📅 Scheduled Appointment' : '👥 Queue Entry'}</p>
                </div>

                <div className="total-summary">
                  <div className="total-row">
                    <span>Total Duration:</span>
                    <span>{calculateTotalDuration()} minutes</span>
                  </div>
                  <div className="total-row final-total">
                    <span>Total Amount:</span>
                    <span>₹{calculateTotal()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bag-footer">
          <div className="bag-summary">
            <div className="summary-info">
              <span className="services-count">{selectedServices.length} services selected</span>
              <span className="total-amount">₹{calculateTotal()}</span>
            </div>
          </div>
          
          <div className="bag-actions">
            {currentStep === 'services' && (
              <button 
                className={`proceed-btn ${selectedServices.length === 0 ? 'disabled' : ''}`}
                onClick={handleProceedToNext}
                disabled={selectedServices.length === 0}
              >
                Continue ({selectedServices.length} services)
              </button>
            )}
            
            {currentStep === 'details' && (
              <div className="details-actions">
                <button 
                  className="back-step-btn"
                  onClick={() => setCurrentStep('services')}
                >
                  Back to Services
                </button>
                <button 
                  className="proceed-btn"
                  onClick={handleProceedToNext}
                >
                  Review & Checkout
                </button>
              </div>
            )}
            
            {currentStep === 'checkout' && (
              <div className="checkout-actions">
                <button 
                  className="back-step-btn"
                  onClick={() => setCurrentStep('details')}
                >
                  Back to Details
                </button>
                <button 
                  className="checkout-btn"
                  onClick={handleProceedToCheckout}
                >
                  {bookingType === 'appointment' ? 'Book Appointment' : 'Join Queue'} - ₹{calculateTotal()}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShoppingBagInterface;
import React, { useState } from 'react';

const MoreInfoPage = ({ salon, onClose }) => {
  const [activeTab, setActiveTab] = useState('info');

  const handleCall = (phoneNumber) => {
    if (phoneNumber) {
      window.open(`tel:${phoneNumber}`);
    }
  };

  const handleDirection = () => {
    const address = encodeURIComponent(salon.vicinity || salon.formatted_address);
    window.open(`https://maps.google.com/?q=${address}`);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'info':
        return (
          <div style={{ padding: '24px' }}>
            {/* Salon Header */}
            <div style={{ marginBottom: '32px', textAlign: 'center' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#212529', marginBottom: '8px' }}>
                {salon.name}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginBottom: '8px' }}>
                <span style={{ color: '#ffc107', fontSize: '16px' }}>★</span>
                <span style={{ fontSize: '16px', fontWeight: '500', color: '#212529' }}>
                  {salon.rating || '4.5'}
                </span>
                <span style={{ fontSize: '14px', color: '#6c757d' }}>
                  ({salon.user_ratings_total || '150'} reviews)
                </span>
              </div>
              <p style={{ fontSize: '14px', color: '#6c757d', margin: 0 }}>
                {salon.vicinity || salon.formatted_address}
              </p>
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '32px' }}>
              <button
                onClick={() => handleCall(salon.formatted_phone_number)}
                style={{
                  padding: '16px',
                  backgroundColor: '#007bff',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                📞 Call Now
              </button>
              <button
                onClick={handleDirection}
                style={{
                  padding: '16px',
                  backgroundColor: '#28a745',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                🗺️ Directions
              </button>
            </div>

            {/* Salon Details */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#212529' }}>
                Salon Information
              </h3>
              
              <div style={{ backgroundColor: '#f8f9fa', borderRadius: '8px', padding: '16px' }}>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#495057', marginBottom: '4px' }}>
                    Address
                  </div>
                  <div style={{ fontSize: '14px', color: '#212529' }}>
                    {salon.formatted_address || salon.vicinity}
                  </div>
                </div>

                {salon.formatted_phone_number && (
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '14px', fontWeight: '500', color: '#495057', marginBottom: '4px' }}>
                      Phone
                    </div>
                    <div style={{ fontSize: '14px', color: '#212529' }}>
                      {salon.formatted_phone_number}
                    </div>
                  </div>
                )}

                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#495057', marginBottom: '4px' }}>
                    Hours
                  </div>
                  <div style={{ fontSize: '14px', color: '#28a745' }}>
                    Open • Closes 8:00 PM
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#495057', marginBottom: '4px' }}>
                    Price Level
                  </div>
                  <div style={{ fontSize: '14px', color: '#212529' }}>
                    {'₹'.repeat(salon.price_level || 2)} • Moderate
                  </div>
                </div>
              </div>
            </div>

            {/* Services */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#212529' }}>
                Services Offered
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px' }}>
                {(salon.services || [
                  'Haircut', 'Beard Trim', 'Hair Wash', 'Styling', 'Shampoo', 'Massage'
                ]).map((service, index) => (
                  <div
                    key={index}
                    style={{
                      backgroundColor: '#e3f2fd',
                      border: '1px solid #bbdefb',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      fontSize: '13px',
                      fontWeight: '500',
                      color: '#1976d2',
                      textAlign: 'center'
                    }}
                  >
                    {service}
                  </div>
                ))}
              </div>
            </div>

            {/* Amenities */}
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#212529' }}>
                Amenities
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                {[
                  '🅿️ Parking Available',
                  '💳 Card Payment',
                  '📶 Free WiFi',
                  '❄️ Air Conditioned',
                  '🚿 Hair Wash',
                  '☕ Complimentary Tea'
                ].map((amenity, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '14px',
                      color: '#495057'
                    }}
                  >
                    {amenity}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'reviews':
        return (
          <div style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '24px', color: '#212529' }}>
              Customer Reviews
            </h3>

            {/* Overall Rating */}
            <div style={{
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '24px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '36px', fontWeight: '700', color: '#007bff', marginBottom: '8px' }}>
                {salon.rating || '4.5'}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <span
                    key={star}
                    style={{
                      color: star <= Math.floor(salon.rating || 4.5) ? '#ffc107' : '#e9ecef',
                      fontSize: '20px'
                    }}
                  >
                    ★
                  </span>
                ))}
              </div>
              <div style={{ fontSize: '14px', color: '#6c757d' }}>
                Based on {salon.user_ratings_total || '150'} reviews
              </div>
            </div>

            {/* Individual Reviews */}
            <div>
              {[
                {
                  name: 'Rajesh Kumar',
                  rating: 5,
                  time: '2 days ago',
                  review: 'Excellent service! The staff is very professional and the haircut was exactly what I wanted. Clean environment and reasonable prices.'
                },
                {
                  name: 'Amit Sharma',
                  rating: 4,
                  time: '1 week ago',
                  review: 'Good salon with skilled barbers. The waiting time was a bit long but the service quality made up for it. Will visit again.'
                },
                {
                  name: 'Priya Singh',
                  rating: 5,
                  time: '2 weeks ago',
                  review: 'Amazing experience! The stylist understood exactly what I wanted. Very hygienic place and friendly staff. Highly recommended!'
                }
              ].map((review, index) => (
                <div
                  key={index}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e9ecef',
                    borderRadius: '8px',
                    padding: '16px',
                    marginBottom: '12px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ fontSize: '16px', fontWeight: '600', color: '#212529' }}>
                      {review.name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6c757d' }}>
                      {review.time}
                    </div>
                  </div>
                  <div style={{ display: 'flex', marginBottom: '8px' }}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <span
                        key={star}
                        style={{
                          color: star <= review.rating ? '#ffc107' : '#e9ecef',
                          fontSize: '14px'
                        }}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <p style={{ fontSize: '14px', color: '#495057', margin: 0, lineHeight: '1.4' }}>
                    {review.review}
                  </p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'help':
        return (
          <div style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '24px', color: '#212529' }}>
              Help & Support
            </h3>

            {/* FAQ */}
            <div style={{ marginBottom: '32px' }}>
              <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#212529' }}>
                Frequently Asked Questions
              </h4>
              
              {[
                {
                  question: 'How do I cancel my appointment?',
                  answer: 'You can cancel your appointment up to 2 hours before the scheduled time. Contact the salon directly or use the app to cancel.'
                },
                {
                  question: 'What payment methods are accepted?',
                  answer: 'We accept cash, all major credit/debit cards, UPI, and digital wallets like Paytm, PhonePe, and Google Pay.'
                },
                {
                  question: 'Do I need to bring anything for my appointment?',
                  answer: 'No, we provide all necessary equipment and products. Just bring yourself and arrive on time!'
                },
                {
                  question: 'Is there parking available?',
                  answer: 'Yes, we have dedicated parking space for our customers. Street parking is also available nearby.'
                }
              ].map((faq, index) => (
                <div
                  key={index}
                  style={{
                    backgroundColor: '#f8f9fa',
                    border: '1px solid #e9ecef',
                    borderRadius: '8px',
                    padding: '16px',
                    marginBottom: '12px'
                  }}
                >
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#212529', marginBottom: '8px' }}>
                    {faq.question}
                  </div>
                  <div style={{ fontSize: '14px', color: '#495057', lineHeight: '1.4' }}>
                    {faq.answer}
                  </div>
                </div>
              ))}
            </div>

            {/* Contact Support */}
            <div>
              <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#212529' }}>
                Need More Help?
              </h4>
              
              <div style={{ display: 'grid', gap: '12px' }}>
                <button
                  onClick={() => handleCall(salon.formatted_phone_number)}
                  style={{
                    padding: '16px',
                    backgroundColor: '#007bff',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  📞 Call Salon Directly
                </button>
                
                <button
                  onClick={() => window.open('mailto:support@realsalonfinder.com')}
                  style={{
                    padding: '16px',
                    backgroundColor: '#28a745',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  ✉️ Email Support
                </button>
                
                <button
                  onClick={() => window.open('https://wa.me/919876543210')}
                  style={{
                    padding: '16px',
                    backgroundColor: '#25d366',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  💬 WhatsApp Support
                </button>
              </div>
            </div>
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
      background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      zIndex: 99999,
      overflowY: 'auto'
    }}>
      <div style={{
        maxWidth: '500px',
        margin: '0 auto',
        minHeight: '100vh',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #e9ecef',
          backgroundColor: '#ffffff',
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button
              onClick={onClose}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                fontSize: '16px',
                cursor: 'pointer',
                padding: '4px',
                color: '#007bff'
              }}
            >
              ← Back
            </button>
            <h1 style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: '600',
              color: '#212529',
              textAlign: 'center',
              flex: 1
            }}>
              More Info
            </h1>
            <div style={{ width: '60px' }}></div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          backgroundColor: '#f8f9fa',
          borderBottom: '1px solid #e9ecef'
        }}>
          {[
            { id: 'info', label: 'Info', icon: 'ℹ️' },
            { id: 'reviews', label: 'Reviews', icon: '⭐' },
            { id: 'help', label: 'Help', icon: '❓' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: '16px 8px',
                backgroundColor: activeTab === tab.id ? '#ffffff' : 'transparent',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid #007bff' : '2px solid transparent',
                color: activeTab === tab.id ? '#007bff' : '#6c757d',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {renderTabContent()}
      </div>
    </div>
  );
};

export default MoreInfoPage;

import React, { useState } from 'react';
import './MobileSalonView.css';

const MobileSalonView = ({ salon, onClose, onJoinQueue }) => {
  const [selectedServices, setSelectedServices] = useState([]);
  
  const services = [
    { name: 'Traditional men\'s haircut', duration: '30 min', price: '₹250', selected: true },
    { name: 'Beard Trim + Shape', duration: '20 min', price: '₹150', selected: false },
  ];

  return (
    <div 
      className="mobile-salon-page"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#0f0f23',
        background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)',
        zIndex: 99999,
        overflowY: 'auto',
        color: '#ffffff'
      }}
    >
      <div 
        className="mobile-salon-container"
        style={{
          width: '100%',
          maxWidth: '500px',
          margin: '0 auto',
          minHeight: '100vh',
          backgroundColor: '#1e1e2e'
        }}
      >
        {/* Header */}
        <div 
          className="page-header"
          style={{
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #333',
            backgroundColor: '#1a1a2e'
          }}
        >
          <button 
            className="back-btn" 
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: '#ffffff',
              fontSize: '16px',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: '400'
            }}
          >
            ← Back
          </button>
          <h1 style={{
            margin: 0,
            fontSize: '16px',
            fontWeight: '500',
            color: '#ffffff',
            textAlign: 'center',
            flex: 1
          }}>Join Queue - {salon.name}</h1>
          <div style={{ width: '60px' }}></div>
        </div>

        {/* Progress Steps */}
        <div 
          className="progress-steps"
          style={{
            display: 'flex',
            justifyContent: 'center',
            padding: '20px',
            gap: '32px',
            backgroundColor: '#1e1e2e'
          }}
        >
          <div className="step active">
            <span 
              className="step-number"
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: '#007bff',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: '500'
              }}
            >1</span>
            <span 
              className="step-label"
              style={{
                color: '#007bff',
                fontSize: '11px',
                fontWeight: '400',
                marginTop: '4px',
                display: 'block',
                textAlign: 'center'
              }}
            >Services</span>
          </div>
          <div className="step">
            <span 
              className="step-number"
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: '#444',
                color: '#aaa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: '400'
              }}
            >2</span>
            <span 
              className="step-label"
              style={{
                color: '#aaa',
                fontSize: '11px',
                fontWeight: '400',
                marginTop: '4px',
                display: 'block',
                textAlign: 'center'
              }}
            >Details</span>
          </div>
          <div className="step">
            <span 
              className="step-number"
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: '#444',
                color: '#aaa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: '400'
              }}
            >3</span>
            <span 
              className="step-label"
              style={{
                color: '#aaa',
                fontSize: '11px',
                fontWeight: '400',
                marginTop: '4px',
                display: 'block',
                textAlign: 'center'
              }}
            >Payment</span>
          </div>
        </div>

        {/* Alert */}
        <div 
          className="alert-box"
          style={{
            margin: '0 20px 16px 20px',
            padding: '10px 12px',
            backgroundColor: '#2a2a3a',
            border: '1px solid #444',
            borderRadius: '6px',
            color: '#ccc',
            fontSize: '12px',
            fontWeight: '400',
            lineHeight: '1.3'
          }}
        >
          <span style={{ marginRight: '6px', fontSize: '12px' }}>⚠️</span>
          Selected services with duration & pricing. Salon payment requires you guaranteed spot in the queue.
        </div>

        {/* Services Selection */}
        <div 
          className="services-selection"
          style={{
            padding: '0 20px 20px 20px'
          }}
        >
          <h3 style={{
            margin: '0 0 12px 0',
            fontSize: '14px',
            fontWeight: '500',
            color: '#ffffff'
          }}>Select Services</h3>
          {services.map((service, index) => (
            <div 
              key={index} 
              className={`service-card ${service.selected ? 'selected' : ''}`}
              style={{
                backgroundColor: service.selected ? '#007bff' : '#2a2a3a',
                border: service.selected ? '1px solid #007bff' : '1px solid #444',
                borderRadius: '6px',
                padding: '12px',
                marginBottom: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div className="service-info">
                <h4 style={{
                  margin: '0 0 2px 0',
                  fontSize: '14px',
                  fontWeight: '400',
                  color: '#ffffff'
                }}>{service.name}</h4>
                <div className="service-meta" style={{
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'center'
                }}>
                  <span 
                    className="duration"
                    style={{
                      fontSize: '12px',
                      color: '#aaa',
                      fontWeight: '400'
                    }}
                  >{service.duration}</span>
                  <span 
                    className="price"
                    style={{
                      fontSize: '12px',
                      color: '#aaa',
                      fontWeight: '400'
                    }}
                  >{service.price}</span>
                </div>
              </div>
              <div 
                className="service-checkbox"
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  border: '1px solid #666',
                  backgroundColor: service.selected ? '#007bff' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  color: '#ffffff'
                }}
              >
                {service.selected && '✓'}
              </div>
            </div>
          ))}
        </div>

        {/* Continue Button */}
        <div style={{ padding: '0 20px 24px 20px' }}>
          <button 
            className="continue-btn"
            onClick={() => onJoinQueue(salon)}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#007bff',
              border: 'none',
              borderRadius: '6px',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileSalonView;

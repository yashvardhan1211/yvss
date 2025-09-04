import React, { useState, useEffect } from 'react';
import './BookingUpdatesModal.css';
import { useRealTimeQueue } from '../hooks/useRealTimeQueue';
import websocketService from '../services/websocketService';

const BookingUpdatesModal = ({ booking, onClose }) => {
  const [currentBooking, setCurrentBooking] = useState(booking);
  const { customerStatus, isConnected } = useRealTimeQueue(booking.salonId, 'customer', booking.customerId);
  
  // Listen for booking status updates
  useEffect(() => {
    const handleBookingStatusUpdate = (event) => {
      const data = event.detail;
      if (data.bookingId === currentBooking.id) {
        setCurrentBooking(prevBooking => ({
          ...prevBooking,
          status: data.status,
          queuePosition: data.queuePosition || prevBooking.queuePosition,
          estimatedWaitTime: data.estimatedWaitTime || prevBooking.estimatedWaitTime,
          updatedAt: new Date().toISOString()
        }));
      }
    };
    
    window.addEventListener('bookingStatusUpdated', handleBookingStatusUpdate);
    
    return () => {
      window.removeEventListener('bookingStatusUpdated', handleBookingStatusUpdate);
    };
  }, [currentBooking.id]);
  
  // Update local storage when booking changes
  useEffect(() => {
    if (currentBooking.id) {
      const userBookings = JSON.parse(localStorage.getItem('userBookings') || '[]');
      const updatedBookings = userBookings.map(b => 
        b.id === currentBooking.id ? currentBooking : b
      );
      localStorage.setItem('userBookings', JSON.stringify(updatedBookings));
    }
  }, [currentBooking]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return '#28a745';
      case 'in_progress': return '#007bff';
      case 'waiting': return '#ffc107';
      case 'in_queue': return '#17a2b8';
      case 'completed': return '#6c757d';
      case 'cancelled': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed': return '✅';
      case 'in_progress': return '🔄';
      case 'waiting': return '⏳';
      case 'in_queue': return '🚶‍♂️';
      case 'completed': return '✨';
      case 'cancelled': return '❌';
      default: return '📋';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const calculateTotal = (services) => {
    if (!services || !Array.isArray(services)) return 0;
    return services.reduce((total, service) => total + (service.price || 0), 0);
  };

  // Function to manually refresh booking status
  const refreshBookingStatus = () => {
    if (isConnected && currentBooking.id) {
      websocketService.updateBookingStatus(
        currentBooking.id, 
        currentBooking.status, 
        {
          salonId: currentBooking.salonId,
          customerId: currentBooking.customerId,
          queuePosition: currentBooking.queuePosition,
          estimatedWaitTime: currentBooking.estimatedWaitTime
        }
      );
    }
  };

  return (
    <div className="booking-updates-modal-overlay">
      <div className="booking-updates-modal">
        <div className="booking-updates-modal-header">
          <h2>🔔 Real-time Booking Updates</h2>
          <button onClick={onClose} className="close-modal-btn">×</button>
        </div>

        <div className="connection-status">
          <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}></span>
          <span className="status-text">{isConnected ? 'Connected' : 'Disconnected'}</span>
          <button 
            className="refresh-btn" 
            onClick={refreshBookingStatus} 
            disabled={!isConnected}
          >
            🔄 Refresh
          </button>
        </div>

        <div className="booking-updates-content">
          <div className="booking-card">
            <div className="booking-header">
              <div className="booking-salon">
                <h3>{currentBooking.salonName}</h3>
                <p className="booking-type">
                  {currentBooking.type === 'queue' ? '👥 Queue Entry' : '📅 Appointment'}
                </p>
              </div>
              <div className="booking-status">
                <span 
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(currentBooking.status) }}
                >
                  {getStatusIcon(currentBooking.status)} {currentBooking.status}
                </span>
              </div>
            </div>

            <div className="booking-details">
              <div className="booking-info">
                <div className="info-item">
                  <span className="label">Customer:</span>
                  <span className="value">{currentBooking.customerName}</span>
                </div>
                <div className="info-item">
                  <span className="label">Phone:</span>
                  <span className="value">{currentBooking.customerPhone}</span>
                </div>
                <div className="info-item">
                  <span className="label">Booked:</span>
                  <span className="value">{formatDate(currentBooking.createdAt || new Date())}</span>
                </div>
                {currentBooking.type === 'queue' && (
                  <>
                    <div className="info-item queue-position">
                      <span className="label">Queue Position:</span>
                      <span className="value queue-number">#{customerStatus.position || currentBooking.queuePosition || 'Updating...'}</span>
                    </div>
                    <div className="info-item queue-wait">
                      <span className="label">Est. Wait Time:</span>
                      <span className="value">~{customerStatus.estimatedWaitTime || currentBooking.estimatedWaitTime || 15} minutes</span>
                    </div>
                  </>
                )}
                {currentBooking.updatedAt && currentBooking.updatedAt !== currentBooking.createdAt && (
                  <div className="info-item last-updated">
                    <span className="label">Last Updated:</span>
                    <span className="value">{formatDate(currentBooking.updatedAt)}</span>
                  </div>
                )}
              </div>

              <div className="booking-services">
                <h4>Services:</h4>
                <div className="services-list">
                  {booking.selectedServices?.map((service, index) => (
                    <div key={index} className="service-item">
                      <span className="service-name">{service.name}</span>
                      <span className="service-price">₹{service.price}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="booking-total">
                <strong>Total: ₹{booking.totalAmount || calculateTotal(booking.selectedServices)}</strong>
              </div>

              {booking.specialRequests && (
                <div className="booking-notes">
                  <h4>Special Requests:</h4>
                  <p>{booking.specialRequests}</p>
                </div>
              )}
            </div>

            <div className="booking-actions">
              {booking.paymentId && (
                <div className="payment-info">
                  💳 Payment ID: {booking.paymentId.slice(-8)}
                </div>
              )}
            </div>
          </div>

          <div className="real-time-updates">
            <h3>📊 Real-time Status</h3>
            <div className="updates-list">
              <div className="update-item">
                <div className="update-icon">{customerStatus.position ? '🚶‍♂️' : '⏳'}</div>
                <div className="update-content">
                  <h4>Queue Position</h4>
                  <p>{customerStatus.position ? `You are #${customerStatus.position} in line` : 'Waiting for queue update...'}</p>
                </div>
              </div>
              <div className="update-item">
                <div className="update-icon">⏱️</div>
                <div className="update-content">
                  <h4>Estimated Wait Time</h4>
                  <p>{customerStatus.estimatedWaitTime ? `~${customerStatus.estimatedWaitTime} minutes` : 'Calculating...'}</p>
                </div>
              </div>
              <div className="update-item">
                <div className="update-icon">{isConnected ? '🟢' : '🔴'}</div>
                <div className="update-content">
                  <h4>Connection Status</h4>
                  <p>{isConnected ? 'Connected to real-time updates' : 'Disconnected - trying to reconnect...'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="booking-updates-footer">
          <p>💡 This screen will automatically update as your booking status changes</p>
        </div>
      </div>
    </div>
  );
};

export default BookingUpdatesModal;
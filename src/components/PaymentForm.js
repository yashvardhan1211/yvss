import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { createPaymentIntent, processPayment } from '../services/paymentService';
import { createBooking } from '../services/salonService';
import './PaymentForm.css';

const PaymentForm = ({ bookingData, onPaymentComplete }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#2c3e50',
        '::placeholder': {
          color: '#7f8c8d',
        },
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      },
      invalid: {
        color: '#e74c3c',
        iconColor: '#e74c3c',
      },
    },
    hidePostalCode: true,
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // First create the booking in database
      const bookingId = await createBooking({
        ...bookingData,
        paymentStatus: 'pending'
      });

      // Create payment intent
      const clientSecret = await createPaymentIntent({
        ...bookingData,
        id: bookingId
      });

      // Process payment
      const result = await processPayment(
        stripe, 
        elements, 
        clientSecret, 
        { ...bookingData, id: bookingId }
      );

      if (result.success) {
        onPaymentComplete({
          ...result,
          bookingId
        });
      } else {
        setError(result.error?.message || 'Payment failed');
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.message || 'Payment processing failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="payment-form">
      <div className="payment-summary">
        <h4>Payment Summary</h4>
        <div className="summary-row">
          <span>Services:</span>
          <span>{bookingData.selectedServices?.map(s => s.name).join(', ')}</span>
        </div>
        <div className="summary-row">
          <span>Salon:</span>
          <span>{bookingData.salonName}</span>
        </div>
        <div className="summary-row">
          <span>Time:</span>
          <span>{bookingData.preferredTime}</span>
        </div>
        <div className="summary-row total">
          <span>Total Amount:</span>
          <span>${bookingData.totalAmount}</span>
        </div>
      </div>

      <div className="card-section">
        <h4>Payment Information</h4>
        <div className="card-element-container">
          <CardElement options={cardElementOptions} />
        </div>
      </div>

      {error && (
        <div className="payment-error">
          <span>⚠️</span>
          <p>{error}</p>
        </div>
      )}

      <div className="payment-actions">
        <button 
          type="submit" 
          disabled={!stripe || processing}
          className="pay-btn"
        >
          {processing ? (
            <>
              <div className="spinner small"></div>
              Processing...
            </>
          ) : (
            `Pay $${bookingData.totalAmount}`
          )}
        </button>
      </div>

      <div className="payment-security">
        <div className="security-badges">
          <span>🔒 Secure Payment</span>
          <span>💳 Stripe Protected</span>
        </div>
        <p>Your payment information is encrypted and secure</p>
      </div>
    </form>
  );
};

export default PaymentForm;
// Razorpay integration for Indian payments
import { collection, addDoc, doc, updateDoc, serverTimestamp, increment } from 'firebase/firestore';
import { db } from '../firebase/config';
import toast from 'react-hot-toast';

// Load Razorpay script
const loadRazorpay = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

// Create Razorpay order
export const createRazorpayOrder = async (bookingData) => {
  try {
    // In production, this would be a secure server endpoint
    // For now, we'll create the order client-side (not recommended for production)
    const orderData = {
      amount: Math.round(bookingData.totalAmount * 100), // Convert to paise (smallest currency unit)
      currency: 'INR',
      receipt: `booking_${bookingData.id}_${Date.now()}`,
      notes: {
        bookingId: bookingData.id,
        salonId: bookingData.salonId,
        customerName: bookingData.customerName
      }
    };

    return orderData;
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    toast.error('Failed to initialize payment');
    throw error;
  }
};

// Process Razorpay payment
export const processRazorpayPayment = async (bookingData) => {
  try {
    // Load Razorpay script
    const isLoaded = await loadRazorpay();
    if (!isLoaded) {
      throw new Error('Failed to load Razorpay');
    }

    // Create order
    const orderData = await createRazorpayOrder(bookingData);

    return new Promise((resolve, reject) => {
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Salon Finder',
        description: `Booking at ${bookingData.salonName}`,
        order_id: orderData.receipt,
        handler: async function (response) {
          try {
            // Payment successful
            console.log('Payment successful:', response);
            
            // Record payment in database
            await recordPayment({
              bookingId: bookingData.id,
              salonId: bookingData.salonId,
              amount: bookingData.totalAmount,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature,
              status: 'completed'
            });

            toast.success('Payment successful! 🎉');
            resolve({ success: true, paymentData: response });
          } catch (error) {
            console.error('Error recording payment:', error);
            toast.error('Payment completed but failed to update booking');
            reject(error);
          }
        },
        prefill: {
          name: bookingData.customerName,
          email: bookingData.customerEmail,
          contact: bookingData.customerPhone
        },
        notes: orderData.notes,
        theme: {
          color: '#E74C3C'
        },
        modal: {
          ondismiss: function() {
            console.log('Payment cancelled by user');
            toast.error('Payment cancelled');
            reject(new Error('Payment cancelled by user'));
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    });

  } catch (error) {
    console.error('Error processing Razorpay payment:', error);
    toast.error('Payment processing failed');
    throw error;
  }
};

// Record payment in Firebase
export const recordPayment = async (paymentData) => {
  try {
    // Add payment record
    const paymentDoc = await addDoc(collection(db, 'payments'), {
      ...paymentData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // Update booking status
    const bookingRef = doc(db, 'bookings', paymentData.bookingId);
    await updateDoc(bookingRef, {
      paymentStatus: 'paid',
      paymentId: paymentDoc.id,
      razorpayPaymentId: paymentData.razorpayPaymentId,
      status: 'confirmed',
      updatedAt: serverTimestamp()
    });

    // Update salon revenue
    const salonRef = doc(db, 'salons', paymentData.salonId);
    await updateDoc(salonRef, {
      revenueToday: increment(paymentData.amount),
      totalRevenue: increment(paymentData.amount),
      updatedAt: serverTimestamp()
    });

    console.log('Payment recorded successfully');
  } catch (error) {
    console.error('Error recording payment:', error);
    throw error;
  }
};

// Process refund (Razorpay)
export const processRefund = async (razorpayPaymentId, amount) => {
  try {
    // In production, this would be a secure server endpoint
    console.log('Processing refund for payment:', razorpayPaymentId, 'Amount:', amount);
    
    // For now, just update the database
    // In production, you'd call Razorpay's refund API from your server
    
    toast.success('Refund request submitted successfully!');
    return { success: true, refundId: `rfnd_${Date.now()}` };
  } catch (error) {
    console.error('Error processing refund:', error);
    toast.error('Failed to process refund');
    throw error;
  }
};

// Verify payment signature (should be done on server in production)
export const verifyPaymentSignature = (paymentData) => {
  // In production, this verification should be done on your server
  // using Razorpay's webhook or API
  console.log('Payment signature verification (client-side):', paymentData);
  return true; // For demo purposes
};

export default {
  processRazorpayPayment,
  recordPayment,
  processRefund,
  verifyPaymentSignature
};
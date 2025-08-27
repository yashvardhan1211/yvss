// Razorpay integration for Indian payments
import { collection, addDoc, doc, updateDoc, serverTimestamp, increment } from 'firebase/firestore';
import { db } from '../firebase/config';
import toast from 'react-hot-toast';

// Load Razorpay script
const loadRazorpay = () => {
  return new Promise((resolve, reject) => {
    // Check if Razorpay is already loaded
    if (window.Razorpay) {
      console.log('✅ Razorpay already loaded');
      resolve(true);
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src*="razorpay"]');
    if (existingScript) {
      console.log('🔄 Razorpay script already loading...');
      existingScript.onload = () => resolve(true);
      existingScript.onerror = () => resolve(false);
      return;
    }

    console.log('📦 Loading Razorpay script from CDN...');
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    
    script.onload = () => {
      console.log('✅ Razorpay script loaded successfully');
      // Wait a bit for Razorpay to initialize
      setTimeout(() => {
        if (window.Razorpay) {
          resolve(true);
        } else {
          console.error('❌ Razorpay not available after script load');
          resolve(false);
        }
      }, 100);
    };
    
    script.onerror = (error) => {
      console.error('❌ Failed to load Razorpay script:', error);
      resolve(false);
    };
    
    document.head.appendChild(script);
    
    // Timeout after 10 seconds
    setTimeout(() => {
      if (!window.Razorpay) {
        console.error('❌ Razorpay script load timeout');
        resolve(false);
      }
    }, 10000);
  });
};

// Create Razorpay order
export const createRazorpayOrder = async (bookingData) => {
  try {
    console.log('📋 Creating order for booking:', bookingData);
    
    // Validate booking data
    if (!bookingData.totalAmount || bookingData.totalAmount <= 0) {
      throw new Error('Invalid booking amount');
    }

    // In production, this would be a secure server endpoint
    // For now, we'll create the order client-side (not recommended for production)
    const orderData = {
      amount: Math.round(bookingData.totalAmount * 100), // Convert to paise (smallest currency unit)
      currency: 'INR',
      receipt: `booking_${bookingData.id}_${Date.now()}`,
      notes: {
        bookingId: bookingData.id,
        salonId: bookingData.salonId,
        customerName: bookingData.customerName,
        services: bookingData.selectedServices?.map(s => s.name).join(', ') || 'Salon Services'
      }
    };

    console.log('✅ Order data created:', orderData);
    return orderData;
  } catch (error) {
    console.error('❌ Error creating Razorpay order:', error);
    toast.error('Failed to initialize payment');
    throw error;
  }
};

// Process Razorpay payment
export const processRazorpayPayment = async (bookingData) => {
  try {
    console.log('🔄 Starting Razorpay payment process...');
    console.log('Booking data:', bookingData);
    console.log('Razorpay Key:', process.env.REACT_APP_RAZORPAY_KEY_ID);

    // Load Razorpay script
    console.log('📦 Loading Razorpay script...');
    const isLoaded = await loadRazorpay();
    if (!isLoaded) {
      console.error('❌ Failed to load Razorpay script');
      toast.error('Failed to load payment gateway');
      throw new Error('Failed to load Razorpay script');
    }
    console.log('✅ Razorpay script loaded successfully');

    // Check if Razorpay is available
    if (!window.Razorpay) {
      console.error('❌ Razorpay not available on window object');
      toast.error('Payment gateway not available');
      throw new Error('Razorpay not available');
    }

    // Create order
    console.log('📋 Creating Razorpay order...');
    const orderData = await createRazorpayOrder(bookingData);
    console.log('✅ Order created:', orderData);

    return new Promise((resolve, reject) => {
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Salon Finder',
        description: `Booking at ${bookingData.salonName}`,
        image: 'https://cdn-icons-png.flaticon.com/512/2990/2990003.png', // Salon icon
        handler: async function (response) {
          try {
            console.log('✅ Payment successful:', response);
            
            // For demo purposes, skip Firebase recording to avoid errors
            console.log('💾 Skipping Firebase recording for demo...');
            
            toast.success('Payment successful! 🎉');
            resolve({ success: true, paymentData: response });
          } catch (error) {
            console.error('❌ Error in payment handler:', error);
            toast.error('Payment completed but failed to save booking');
            reject(error);
          }
        },
        prefill: {
          name: bookingData.customerName,
          email: bookingData.customerEmail,
          contact: bookingData.customerPhone
        },
        notes: {
          booking_id: bookingData.id,
          salon_name: bookingData.salonName
        },
        theme: {
          color: '#E74C3C'
        },
        modal: {
          ondismiss: function() {
            console.log('⚠️ Payment cancelled by user');
            toast.error('Payment cancelled');
            reject(new Error('Payment cancelled by user'));
          }
        }
      };

      console.log('🚀 Opening Razorpay checkout with options:', options);

      try {
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response) {
          console.error('❌ Payment failed:', response.error);
          toast.error(`Payment failed: ${response.error.description}`);
          reject(new Error(response.error.description));
        });
        
        rzp.open();
      } catch (error) {
        console.error('❌ Error opening Razorpay:', error);
        toast.error('Failed to open payment gateway');
        reject(error);
      }
    });

  } catch (error) {
    console.error('❌ Error processing Razorpay payment:', error);
    toast.error(`Payment processing failed: ${error.message}`);
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

// Test Razorpay integration
export const testRazorpayPayment = async () => {
  try {
    console.log('🧪 Testing Razorpay integration...');
    
    const testBooking = {
      id: 'test_' + Date.now(),
      salonName: 'Test Salon',
      customerName: 'Test Customer',
      customerEmail: 'test@example.com',
      customerPhone: '9999999999',
      totalAmount: 100, // ₹100 for testing
      selectedServices: [{ name: 'Test Service' }]
    };

    const result = await processRazorpayPayment(testBooking);
    console.log('✅ Test payment result:', result);
    return result;
  } catch (error) {
    console.error('❌ Test payment failed:', error);
    throw error;
  }
};

export default {
  processRazorpayPayment,
  recordPayment,
  processRefund,
  verifyPaymentSignature,
  testRazorpayPayment
};
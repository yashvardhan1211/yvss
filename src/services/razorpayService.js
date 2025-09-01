// Razorpay Service for Salon Registration
// This is a demo service - replace with actual backend integration

class RazorpayService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
    this.keyId = process.env.REACT_APP_RAZORPAY_KEY_ID || 'rzp_test_demo_key';
  }

  // Create order for salon registration
  async createOrder(orderData) {
    try {
      // In demo mode, return a mock order
      if (this.keyId === 'rzp_test_demo_key') {
        return {
          id: `order_${Date.now()}`,
          entity: 'order',
          amount: orderData.amount,
          amount_paid: 0,
          amount_due: orderData.amount,
          currency: orderData.currency,
          receipt: orderData.receipt,
          status: 'created',
          attempts: 0,
          notes: orderData.notes,
          created_at: Math.floor(Date.now() / 1000)
        };
      }

      // Real API call (when backend is configured)
      const response = await fetch(`${this.baseURL}/api/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        throw new Error('Failed to create order');
      }

      return await response.json();
    } catch (error) {
      console.error('Create order error:', error);
      throw error;
    }
  }

  // Verify payment after successful transaction
  async verifyPayment(paymentData) {
    try {
      // In demo mode, return success
      if (this.keyId === 'rzp_test_demo_key') {
        return {
          success: true,
          message: 'Payment verified successfully (Demo Mode)',
          paymentId: paymentData.razorpay_payment_id,
          orderId: paymentData.razorpay_order_id
        };
      }

      // Real API call (when backend is configured)
      const response = await fetch(`${this.baseURL}/api/verify-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        throw new Error('Failed to verify payment');
      }

      return await response.json();
    } catch (error) {
      console.error('Verify payment error:', error);
      throw error;
    }
  }

  // Initialize Razorpay checkout
  initializePayment(options) {
    return new Promise((resolve, reject) => {
      if (!window.Razorpay) {
        reject(new Error('Razorpay SDK not loaded'));
        return;
      }

      const rzp = new window.Razorpay({
        ...options,
        handler: function (response) {
          resolve(response);
        },
        modal: {
          ondismiss: function() {
            reject(new Error('Payment cancelled by user'));
          }
        }
      });

      rzp.open();
    });
  }

  // Get payment configuration
  getPaymentConfig() {
    return {
      keyId: this.keyId,
      currency: 'INR',
      name: 'Salon Finder',
      description: 'Salon Registration Fee',
      image: '/logo192.png',
      theme: {
        color: '#007aff'
      }
    };
  }
}

export default new RazorpayService();
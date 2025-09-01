# 💳 Razorpay Integration for Salon Registration

## Overview
The salon owner registration system now includes Razorpay payment gateway integration for the ₹100 direct registration fee.

## Features
- **Real Razorpay Checkout**: Opens actual Razorpay payment interface
- **Secure Payment Processing**: Industry-standard payment security
- **Payment Verification**: Backend verification of payment signatures
- **Demo Mode Fallback**: Graceful fallback when Razorpay is not configured
- **Mobile Responsive**: Works perfectly on all devices

## How It Works

### 1. Registration Flow
1. User selects "Register Directly Here" option
2. Fills salon details and uploads required files
3. Clicks "Pay ₹100 via Razorpay" button
4. Razorpay checkout modal opens
5. User completes payment
6. Payment is verified on backend
7. Registration is completed

### 2. Payment Process
```javascript
// Order Creation
const orderData = {
  amount: 10000, // ₹100 in paise
  currency: 'INR',
  receipt: `salon_reg_${Date.now()}`,
  notes: { salonName, email, phone }
};

// Razorpay Checkout
const options = {
  key: 'rzp_test_1DP5mmOlF5G5ag',
  amount: order.amount,
  currency: 'INR',
  name: 'Salon Finder',
  description: 'Salon Registration Fee',
  order_id: order.id,
  handler: function(response) {
    // Payment successful
    verifyPayment(response);
  }
};
```

### 3. Payment Verification
- Razorpay signature verification
- Order ID validation
- Payment ID confirmation
- Salon data storage

## Configuration

### Environment Variables
```env
# Razorpay Configuration
REACT_APP_RAZORPAY_KEY_ID=rzp_test_1DP5mmOlF5G5ag
REACT_APP_RAZORPAY_KEY_SECRET=your_secret_key
REACT_APP_API_URL=http://localhost:3001
```

### Required Scripts
```html
<!-- In public/index.html -->
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

## Demo Mode
When Razorpay is not properly configured, the system automatically falls back to demo mode:
- Shows demo payment message
- Simulates successful payment
- Proceeds with registration flow
- Logs demo transaction details

## Production Setup

### 1. Backend API Endpoints
Create these endpoints on your backend:

#### POST /api/create-order
```javascript
// Create Razorpay order
app.post('/api/create-order', async (req, res) => {
  const { amount, currency, receipt, notes } = req.body;
  
  const order = await razorpay.orders.create({
    amount,
    currency,
    receipt,
    notes
  });
  
  res.json(order);
});
```

#### POST /api/verify-payment
```javascript
// Verify payment signature
app.post('/api/verify-payment', async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  
  const isValid = validatePaymentSignature(
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature
  );
  
  if (isValid) {
    // Store salon registration data
    await saveSalonRegistration(req.body.salonData);
    res.json({ success: true });
  } else {
    res.status(400).json({ success: false });
  }
});
```

### 2. Razorpay Account Setup
1. Create account at https://razorpay.com
2. Get API keys from dashboard
3. Configure webhook URLs
4. Set up payment methods
5. Update environment variables

### 3. Security Considerations
- Never expose secret key in frontend
- Always verify payments on backend
- Use HTTPS in production
- Implement proper error handling
- Log all transactions

## Testing

### Test Cards (Razorpay Test Mode)
- **Success**: 4111 1111 1111 1111
- **Failure**: 4000 0000 0000 0002
- **CVV**: Any 3 digits
- **Expiry**: Any future date

### Demo Flow
1. Go to salon owner portal
2. Click "Register"
3. Select "Register Directly Here"
4. Fill all required fields
5. Upload minimum 3 shop images
6. Upload at least 1 document
7. Click "Pay ₹100 via Razorpay"
8. Complete payment or see demo mode

## Error Handling
- Network failures gracefully handled
- Payment cancellation detected
- Invalid payments rejected
- User-friendly error messages
- Automatic retry mechanisms

## Mobile Experience
- Responsive Razorpay checkout
- Touch-friendly interface
- Optimized for mobile payments
- UPI and wallet support
- SMS OTP integration

## Support
For Razorpay integration issues:
1. Check browser console for errors
2. Verify API keys are correct
3. Ensure backend endpoints are working
4. Test with Razorpay test cards
5. Contact Razorpay support if needed

## Next Steps
1. Set up production Razorpay account
2. Implement backend API endpoints
3. Configure webhook handlers
4. Set up payment reconciliation
5. Add payment analytics
6. Implement refund system
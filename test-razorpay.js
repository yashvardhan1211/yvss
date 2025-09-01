#!/usr/bin/env node

// Test Razorpay Integration
// Run this to test if Razorpay checkout works

console.log('🧪 Testing Razorpay Integration...\n');

// Test 1: Check if Razorpay script is accessible
console.log('1. Testing Razorpay script accessibility...');
const https = require('https');

const testRazorpayScript = () => {
  return new Promise((resolve, reject) => {
    const req = https.get('https://checkout.razorpay.com/v1/checkout.js', (res) => {
      if (res.statusCode === 200) {
        console.log('   ✅ Razorpay script is accessible');
        resolve(true);
      } else {
        console.log('   ❌ Razorpay script not accessible:', res.statusCode);
        resolve(false);
      }
    });

    req.on('error', (error) => {
      console.log('   ❌ Error accessing Razorpay script:', error.message);
      resolve(false);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      console.log('   ❌ Timeout accessing Razorpay script');
      resolve(false);
    });
  });
};

// Test 2: Check environment variables
console.log('\n2. Testing environment variables...');
const fs = require('fs');
const path = require('path');

const checkEnvVars = () => {
  try {
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      
      if (envContent.includes('REACT_APP_RAZORPAY_KEY_ID')) {
        console.log('   ✅ REACT_APP_RAZORPAY_KEY_ID found in .env');
        
        const keyMatch = envContent.match(/REACT_APP_RAZORPAY_KEY_ID=(.+)/);
        if (keyMatch && keyMatch[1] && keyMatch[1].trim() !== '') {
          const keyId = keyMatch[1].trim();
          console.log('   ✅ Razorpay Key ID:', keyId.substring(0, 12) + '...');
          
          if (keyId.startsWith('rzp_test_')) {
            console.log('   ✅ Using test key (good for development)');
          } else if (keyId.startsWith('rzp_live_')) {
            console.log('   ⚠️  Using live key (be careful!)');
          }
        } else {
          console.log('   ❌ REACT_APP_RAZORPAY_KEY_ID is empty');
        }
      } else {
        console.log('   ❌ REACT_APP_RAZORPAY_KEY_ID not found in .env');
      }
    } else {
      console.log('   ❌ .env file not found');
    }
  } catch (error) {
    console.log('   ❌ Error reading .env file:', error.message);
  }
};

// Test 3: Check if HTML includes Razorpay script
console.log('\n3. Testing HTML script inclusion...');
const checkHtmlScript = () => {
  try {
    const htmlPath = path.join(__dirname, 'public', 'index.html');
    if (fs.existsSync(htmlPath)) {
      const htmlContent = fs.readFileSync(htmlPath, 'utf8');
      
      if (htmlContent.includes('checkout.razorpay.com')) {
        console.log('   ✅ Razorpay script found in index.html');
      } else {
        console.log('   ❌ Razorpay script not found in index.html');
        console.log('   💡 Add this to public/index.html:');
        console.log('      <script src="https://checkout.razorpay.com/v1/checkout.js"></script>');
      }
    } else {
      console.log('   ❌ public/index.html not found');
    }
  } catch (error) {
    console.log('   ❌ Error reading index.html:', error.message);
  }
};

// Run all tests
const runTests = async () => {
  await testRazorpayScript();
  checkEnvVars();
  checkHtmlScript();
  
  console.log('\n🎯 Test Results Summary:');
  console.log('   • If all tests pass, Razorpay should work in browser');
  console.log('   • If tests fail, check the issues mentioned above');
  console.log('   • Test the payment flow in browser at: http://localhost:3000/owner');
  
  console.log('\n📝 Test Payment Details:');
  console.log('   • Amount: ₹100 (10000 paise)');
  console.log('   • Test Card: 4111 1111 1111 1111');
  console.log('   • CVV: Any 3 digits');
  console.log('   • Expiry: Any future date');
  
  console.log('\n🚀 Next Steps:');
  console.log('   1. Start the app: npm start');
  console.log('   2. Go to: http://localhost:3000/owner');
  console.log('   3. Click Register > Register Directly Here');
  console.log('   4. Fill form and click "Pay ₹100 via Razorpay"');
  console.log('   5. Test with the card details above');
};

runTests().catch(console.error);
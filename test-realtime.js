#!/usr/bin/env node

/**
 * Real-Time Integration Test Script
 * 
 * This script tests the WebSocket integration between customer and owner apps
 * Run this alongside the WebSocket server to verify real-time functionality
 */

const io = require('socket.io-client');
const readline = require('readline');

// Configuration
const WEBSOCKET_URL = 'http://localhost:3001';
const TEST_SALON_ID = 'salon_1';

// Create readline interface for interactive testing
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Test clients
let customerSocket = null;
let ownerSocket = null;

// Test data
const testCustomer = {
  id: `customer_test_${Date.now()}`,
  name: 'Test Customer',
  phone: '+91 98765 43210',
  services: [
    { name: 'Haircut', price: 500, duration: 30 },
    { name: 'Beard Trim', price: 200, duration: 15 }
  ]
};

const testOwner = {
  id: `owner_test_${Date.now()}`,
  salonId: TEST_SALON_ID
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function setupCustomerSocket() {
  log('🔌 Connecting customer socket...', 'blue');
  
  customerSocket = io(WEBSOCKET_URL, {
    query: {
      userId: testCustomer.id,
      userType: 'customer'
    }
  });

  customerSocket.on('connect', () => {
    log('✅ Customer connected', 'green');
    customerSocket.emit('join-salon-room', { salonId: TEST_SALON_ID });
  });

  customerSocket.on('disconnect', () => {
    log('❌ Customer disconnected', 'red');
  });

  customerSocket.on('queue-joined', (data) => {
    log(`🎯 Customer joined queue: Position #${data.position}, Wait: ${data.estimatedWaitTime}min`, 'green');
  });

  customerSocket.on('position-updated', (data) => {
    log(`📍 Position updated: #${data.position}, Wait: ${data.estimatedWaitTime}min`, 'yellow');
  });

  customerSocket.on('your-turn', (data) => {
    log(`🎉 IT'S YOUR TURN! ${data.message}`, 'bright');
  });

  customerSocket.on('service-completed', (data) => {
    log(`✨ Service completed at ${data.salonName}`, 'green');
  });

  customerSocket.on('queue-left', (data) => {
    log(`🚪 Left queue: ${data.message}`, 'yellow');
  });

  customerSocket.on('notification', (data) => {
    log(`🔔 Notification: ${data.message}`, 'cyan');
  });
}

function setupOwnerSocket() {
  log('🔌 Connecting owner socket...', 'blue');
  
  ownerSocket = io(WEBSOCKET_URL, {
    query: {
      userId: testOwner.id,
      userType: 'owner'
    }
  });

  ownerSocket.on('connect', () => {
    log('✅ Owner connected', 'green');
    ownerSocket.emit('join-salon-room', { salonId: TEST_SALON_ID });
  });

  ownerSocket.on('disconnect', () => {
    log('❌ Owner disconnected', 'red');
  });

  ownerSocket.on('customer-joined-queue', (data) => {
    log(`👤 New customer: ${data.customer.customerName} joined queue`, 'green');
  });

  ownerSocket.on('queue-updated', (data) => {
    log(`📊 Queue updated: ${data.currentQueue} customers, ${data.estimatedWaitTime}min wait`, 'yellow');
  });

  ownerSocket.on('new-booking', (data) => {
    log(`📅 New booking: ${data.customerName} - ${data.service}`, 'green');
  });

  ownerSocket.on('payment-received', (data) => {
    log(`💰 Payment received: ₹${data.amount}`, 'green');
  });
}

function showMenu() {
  console.log('\n' + '='.repeat(50));
  log('🧪 Real-Time Integration Test Menu', 'bright');
  console.log('='.repeat(50));
  console.log('1. Join queue (as customer)');
  console.log('2. Leave queue (as customer)');
  console.log('3. Complete service (as owner)');
  console.log('4. Create booking (as customer)');
  console.log('5. Update queue manually (as owner)');
  console.log('6. Send notification (as owner)');
  console.log('7. Show connection status');
  console.log('8. Test stress (multiple operations)');
  console.log('9. Exit');
  console.log('='.repeat(50));
}

function handleMenuChoice(choice) {
  switch (choice.trim()) {
    case '1':
      testJoinQueue();
      break;
    case '2':
      testLeaveQueue();
      break;
    case '3':
      testCompleteService();
      break;
    case '4':
      testCreateBooking();
      break;
    case '5':
      testUpdateQueue();
      break;
    case '6':
      testSendNotification();
      break;
    case '7':
      showConnectionStatus();
      break;
    case '8':
      testStressOperations();
      break;
    case '9':
      log('👋 Exiting...', 'yellow');
      process.exit(0);
      break;
    default:
      log('❌ Invalid choice. Please try again.', 'red');
  }
  
  setTimeout(() => {
    showMenu();
    promptUser();
  }, 1000);
}

function testJoinQueue() {
  if (!customerSocket || !customerSocket.connected) {
    log('❌ Customer not connected', 'red');
    return;
  }

  log('🚶‍♂️ Testing join queue...', 'blue');
  
  const queueData = {
    customerName: testCustomer.name,
    customerPhone: testCustomer.phone,
    selectedServices: testCustomer.services,
    totalAmount: testCustomer.services.reduce((sum, s) => sum + s.price, 0),
    totalDuration: testCustomer.services.reduce((sum, s) => sum + s.duration, 0),
    salonId: TEST_SALON_ID
  };

  customerSocket.emit('join-queue', queueData);
}

function testLeaveQueue() {
  if (!customerSocket || !customerSocket.connected) {
    log('❌ Customer not connected', 'red');
    return;
  }

  log('🚪 Testing leave queue...', 'blue');
  
  customerSocket.emit('leave-queue', {
    customerId: testCustomer.id,
    salonId: TEST_SALON_ID
  });
}

function testCompleteService() {
  if (!ownerSocket || !ownerSocket.connected) {
    log('❌ Owner not connected', 'red');
    return;
  }

  log('✅ Testing complete service...', 'blue');
  
  ownerSocket.emit('complete-service', {
    customerId: testCustomer.id,
    salonId: TEST_SALON_ID
  });
}

function testCreateBooking() {
  if (!customerSocket || !customerSocket.connected) {
    log('❌ Customer not connected', 'red');
    return;
  }

  log('📅 Testing create booking...', 'blue');
  
  const bookingData = {
    customerName: testCustomer.name,
    customerPhone: testCustomer.phone,
    salonId: TEST_SALON_ID,
    selectedServices: testCustomer.services,
    preferredTime: '2:30 PM',
    totalAmount: testCustomer.services.reduce((sum, s) => sum + s.price, 0),
    totalDuration: testCustomer.services.reduce((sum, s) => sum + s.duration, 0)
  };

  customerSocket.emit('create-booking', bookingData);
}

function testUpdateQueue() {
  if (!ownerSocket || !ownerSocket.connected) {
    log('❌ Owner not connected', 'red');
    return;
  }

  log('📊 Testing queue update...', 'blue');
  
  const change = Math.random() > 0.5 ? 1 : -1;
  ownerSocket.emit('update-queue', {
    salonId: TEST_SALON_ID,
    change: change
  });
}

function testSendNotification() {
  if (!ownerSocket || !ownerSocket.connected) {
    log('❌ Owner not connected', 'red');
    return;
  }

  log('🔔 Testing send notification...', 'blue');
  
  ownerSocket.emit('send-notification', {
    targetUserId: testCustomer.id,
    notification: {
      type: 'info',
      message: 'Test notification from owner!'
    }
  });
}

function showConnectionStatus() {
  console.log('\n📡 Connection Status:');
  console.log(`Customer: ${customerSocket?.connected ? '🟢 Connected' : '🔴 Disconnected'}`);
  console.log(`Owner: ${ownerSocket?.connected ? '🟢 Connected' : '🔴 Disconnected'}`);
}

function testStressOperations() {
  log('🔥 Running stress test...', 'magenta');
  
  // Simulate multiple customers joining queue
  for (let i = 0; i < 5; i++) {
    setTimeout(() => {
      if (customerSocket?.connected) {
        customerSocket.emit('join-queue', {
          customerName: `Test Customer ${i + 1}`,
          customerPhone: `+91 9876543${i}10`,
          selectedServices: [{ name: 'Haircut', price: 500, duration: 30 }],
          totalAmount: 500,
          totalDuration: 30,
          salonId: TEST_SALON_ID
        });
      }
    }, i * 500);
  }
  
  // Complete some services
  setTimeout(() => {
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        if (ownerSocket?.connected) {
          ownerSocket.emit('complete-service', {
            customerId: `customer_test_${i}`,
            salonId: TEST_SALON_ID
          });
        }
      }, i * 1000);
    }
  }, 3000);
}

function promptUser() {
  rl.question('Choose an option (1-9): ', handleMenuChoice);
}

function main() {
  log('🚀 Starting Real-Time Integration Test', 'bright');
  log('Make sure WebSocket server is running on http://localhost:3001', 'yellow');
  
  // Setup sockets
  setupCustomerSocket();
  setupOwnerSocket();
  
  // Wait a bit for connections
  setTimeout(() => {
    showMenu();
    promptUser();
  }, 2000);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  log('\n👋 Shutting down...', 'yellow');
  
  if (customerSocket) customerSocket.disconnect();
  if (ownerSocket) ownerSocket.disconnect();
  
  rl.close();
  process.exit(0);
});

// Start the test
main();
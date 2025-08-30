#!/usr/bin/env node

/**
 * 🎬 Queue Payment Integration Demo
 * 
 * This script demonstrates the enhanced queue system with payment integration
 */

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

const log = (color, message) => console.log(`${colors[color]}${message}${colors.reset}`);
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function demoQueuePaymentIntegration() {
  log('cyan', '🎬 Queue Payment Integration Demo');
  log('cyan', '=====================================\n');

  // Demo Salon
  const salon = {
    name: 'Glamour Beauty Salon',
    type: 'Beauty Salon',
    queueLength: 4,
    waitTime: 60
  };

  // Demo Services
  const services = [
    { id: 1, name: 'Haircut & Styling', duration: 45, price: 500 },
    { id: 2, name: 'Facial Treatment', duration: 60, price: 800 },
    { id: 3, name: 'Manicure', duration: 30, price: 400 }
  ];

  log('blue', `🏪 Welcome to ${salon.name}`);
  log('yellow', `📊 Current Queue: ${salon.queueLength} people | Wait Time: ~${salon.waitTime} minutes\n`);

  await sleep(1000);

  // Step 1: Customer wants to join queue
  log('green', '👤 Customer: "I want to join the queue"');
  await sleep(1000);

  log('blue', '🔄 System: Opening queue modal...');
  await sleep(1000);

  // Step 2: Service Selection
  log('magenta', '\n📋 STEP 1: Service Selection');
  log('yellow', '┌─────────────────────────────────────────┐');
  log('yellow', '│  Select Services for Queue Entry       │');
  log('yellow', '├─────────────────────────────────────────┤');
  
  services.forEach((service, index) => {
    const selected = index < 2 ? '✅' : '⭕';
    log('yellow', `│ ${selected} ${service.name.padEnd(20)} ₹${service.price.toString().padStart(4)} │`);
  });
  
  log('yellow', '└─────────────────────────────────────────┘');

  const selectedServices = services.slice(0, 2);
  const totalAmount = selectedServices.reduce((sum, s) => sum + s.price, 0);
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration, 0);

  log('green', `✅ Selected: ${selectedServices.length} services | Total: ₹${totalAmount} | Duration: ${totalDuration} min\n`);
  await sleep(2000);

  // Step 3: Customer Details
  log('magenta', '📝 STEP 2: Customer Details');
  const customer = {
    name: 'Priya Sharma',
    phone: '+91-9876543210',
    email: 'priya@example.com'
  };

  log('yellow', '┌─────────────────────────────────────────┐');
  log('yellow', '│  Customer Information                   │');
  log('yellow', '├─────────────────────────────────────────┤');
  log('yellow', `│ Name:  ${customer.name.padEnd(29)} │`);
  log('yellow', `│ Phone: ${customer.phone.padEnd(29)} │`);
  log('yellow', `│ Email: ${customer.email.padEnd(29)} │`);
  log('yellow', '└─────────────────────────────────────────┘\n');
  await sleep(2000);

  // Step 4: Payment Processing
  log('magenta', '💳 STEP 3: Payment Processing');
  log('blue', '🔄 Processing payment with Razorpay...');
  
  // Simulate payment processing
  const paymentSteps = [
    '📦 Loading Razorpay SDK...',
    '🔐 Creating secure payment order...',
    '💳 Opening payment gateway...',
    '✅ Payment successful!'
  ];

  for (const step of paymentSteps) {
    await sleep(800);
    log('cyan', `   ${step}`);
  }

  const paymentId = `pay_${Date.now()}`;
  log('green', `✅ Payment ID: ${paymentId}\n`);
  await sleep(1000);

  // Step 5: Queue Entry Confirmation
  log('magenta', '🚶‍♂️ STEP 4: Queue Entry Confirmation');
  
  const queueEntry = {
    id: `queue_${Date.now()}`,
    customerName: customer.name,
    position: salon.queueLength + 1,
    estimatedWaitTime: (salon.queueLength + 1) * 15,
    paymentId: paymentId,
    status: 'in_queue'
  };

  log('green', '✅ Successfully joined the queue!');
  log('yellow', '┌─────────────────────────────────────────┐');
  log('yellow', '│  Queue Entry Confirmed                  │');
  log('yellow', '├─────────────────────────────────────────┤');
  log('yellow', `│ Position: #${queueEntry.position.toString().padEnd(28)} │`);
  log('yellow', `│ Wait Time: ~${queueEntry.estimatedWaitTime} minutes${' '.repeat(18)} │`);
  log('yellow', `│ Status: ${queueEntry.status.padEnd(30)} │`);
  log('yellow', '└─────────────────────────────────────────┘\n');
  await sleep(2000);

  // Step 6: Real-time Updates Simulation
  log('magenta', '📱 Real-time Position Updates');
  
  const positions = [5, 4, 3, 2, 1];
  for (const pos of positions) {
    await sleep(3000);
    const waitTime = pos * 15;
    
    if (pos === 1) {
      log('green', '🎉 YOUR TURN! Please head to the salon now.');
      log('yellow', '📳 Notification sent: "It\'s your turn at Glamour Beauty Salon!"');
    } else {
      log('blue', `📍 Position Update: #${pos} in queue (~${waitTime} min wait)`);
      if (pos <= 3) {
        log('yellow', '📳 Notification: "You\'re almost there!"');
      }
    }
  }

  await sleep(2000);

  // Step 7: Booking Management
  log('magenta', '\n📋 My Bookings - Ongoing');
  log('yellow', '┌─────────────────────────────────────────┐');
  log('yellow', '│  Glamour Beauty Salon                  │');
  log('yellow', '│  👥 Queue Entry                        │');
  log('yellow', '├─────────────────────────────────────────┤');
  log('yellow', `│ Customer: ${customer.name.padEnd(26)} │`);
  log('yellow', `│ Phone: ${customer.phone.padEnd(29)} │`);
  log('yellow', '│ ─────────────────────────────────────── │');
  log('yellow', '│ Services:                               │');
  selectedServices.forEach(service => {
    log('yellow', `│  • ${service.name.padEnd(25)} ₹${service.price.toString().padStart(4)} │`);
  });
  log('yellow', '│ ─────────────────────────────────────── │');
  log('yellow', `│ 🚶‍♂️ Queue Position: #1                   │`);
  log('yellow', `│ ⏰ Est. Wait Time: ~15 minutes          │`);
  log('yellow', `│ 💳 Payment: ₹${totalAmount} (Confirmed)${' '.repeat(12)} │`);
  log('yellow', '└─────────────────────────────────────────┘\n');

  await sleep(2000);

  // Summary
  log('green', '🎉 Demo Complete!');
  log('cyan', '\n📊 What we demonstrated:');
  log('white', '✅ Payment-required queue joining');
  log('white', '✅ Multi-step service selection');
  log('white', '✅ Secure Razorpay payment processing');
  log('white', '✅ Real-time position updates');
  log('white', '✅ Push notifications');
  log('white', '✅ Booking management integration');
  log('white', '✅ Live queue tracking');

  log('cyan', '\n🚀 Benefits:');
  log('green', '• Customers: No physical waiting, real-time updates');
  log('green', '• Salons: Guaranteed revenue, reduced no-shows');
  log('green', '• System: Better queue management, higher satisfaction');

  log('magenta', '\n🎯 Ready for production deployment!');
}

// Run the demo
demoQueuePaymentIntegration().catch(console.error);
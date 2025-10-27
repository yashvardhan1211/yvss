// Test Real-time Queue Updates
// Run this in browser console to simulate a customer joining queue

const simulateCustomerJoinQueue = () => {
  const newCustomer = {
    id: `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    salonId: 'salon_iitp_hair',
    salonName: 'Elite Hair Studio IITP',
    customerName: 'Test Customer',
    customerPhone: '+91 9999999999',
    customerEmail: 'test@example.com',
    selectedServices: [
      { name: 'Men\'s Haircut', price: 300, duration: 30 },
      { name: 'Beard Trim', price: 150, duration: 20 }
    ],
    totalAmount: 450,
    totalDuration: 50,
    type: 'queue',
    status: 'waiting',
    paymentId: 'pay_test_' + Date.now(),
    createdAt: new Date().toISOString(),
    joinedAt: new Date(),
    queuePosition: 4,
    estimatedWaitTime: 35,
    isPrepaid: true
  };

  // Get existing queue data
  const existingQueueData = JSON.parse(localStorage.getItem('salon_queue_data') || '{}');
  
  if (!existingQueueData['salon_iitp_hair']) {
    existingQueueData['salon_iitp_hair'] = [];
  }
  
  existingQueueData['salon_iitp_hair'].push(newCustomer);
  localStorage.setItem('salon_queue_data', JSON.stringify(existingQueueData));
  
  // Trigger storage event for real-time updates
  window.dispatchEvent(new StorageEvent('storage', {
    key: 'salon_queue_data',
    newValue: JSON.stringify(existingQueueData)
  }));
  
  console.log('✅ Simulated customer joining queue:', newCustomer);
  return newCustomer;
};

// Test function
console.log('🧪 Real-time Queue Test Functions Available:');
console.log('Run: simulateCustomerJoinQueue() to test real-time updates');

// Make function available globally
window.simulateCustomerJoinQueue = simulateCustomerJoinQueue;
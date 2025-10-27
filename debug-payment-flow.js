// Debug Payment Flow - Run in Browser Console

// 1. Check if Elite Hair Studio IITP is in salon list
const checkSalonInList = () => {
  console.log('🔍 Checking salons in current state...');
  // This will only work if you're on the customer app page
  const salonCards = document.querySelectorAll('.salon-card');
  console.log(`Found ${salonCards.length} salon cards`);
  
  salonCards.forEach((card, index) => {
    const name = card.querySelector('.salon-name')?.textContent;
    console.log(`${index + 1}. ${name}`);
  });
};

// 2. Simulate successful payment and queue join
const simulatePaymentSuccess = () => {
  console.log('🧪 Simulating payment success...');
  
  const mockQueueData = {
    name: 'Test Customer',
    phone: '+91 9999999999',
    email: 'test@example.com',
    selectedServices: [
      { id: 'haircut_men', name: 'Men\'s Haircut', price: 300, duration: 30 },
      { id: 'beard_trim', name: 'Beard Trim', price: 150, duration: 20 }
    ],
    totalAmount: 450,
    totalDuration: 50,
    salonName: 'Elite Hair Studio IITP',
    salonId: 'salon_iitp_hair',
    paymentId: 'pay_test_' + Date.now()
  };
  
  // Create booking object
  const newBooking = {
    id: `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    salonId: 'salon_iitp_hair',
    salonName: 'Elite Hair Studio IITP',
    customerName: mockQueueData.name,
    customerPhone: mockQueueData.phone,
    customerEmail: mockQueueData.email,
    selectedServices: mockQueueData.selectedServices,
    totalAmount: mockQueueData.totalAmount,
    totalDuration: mockQueueData.totalDuration,
    type: 'queue',
    status: 'waiting',
    paymentId: mockQueueData.paymentId,
    createdAt: new Date().toISOString(),
    joinedAt: new Date(),
    queuePosition: 4,
    estimatedWaitTime: 35,
    isPrepaid: true
  };
  
  console.log('📝 Created booking:', newBooking);
  
  // Add to userBookings localStorage
  const existingUserBookings = JSON.parse(localStorage.getItem('userBookings') || '[]');
  existingUserBookings.unshift(newBooking);
  localStorage.setItem('userBookings', JSON.stringify(existingUserBookings));
  console.log('💾 Saved to userBookings:', existingUserBookings);
  
  // Add to salon queue data
  const existingQueueData = JSON.parse(localStorage.getItem('salon_queue_data') || '{}');
  if (!existingQueueData['salon_iitp_hair']) {
    existingQueueData['salon_iitp_hair'] = [];
  }
  existingQueueData['salon_iitp_hair'].push(newBooking);
  localStorage.setItem('salon_queue_data', JSON.stringify(existingQueueData));
  console.log('💾 Saved to salon_queue_data:', existingQueueData);
  
  // Trigger storage event for owner dashboard
  window.dispatchEvent(new StorageEvent('storage', {
    key: 'salon_queue_data',
    newValue: JSON.stringify(existingQueueData)
  }));
  
  console.log('✅ Payment simulation complete!');
  console.log('📱 Check "My Bookings" in customer app');
  console.log('🏪 Check owner dashboard for new customer');
  
  return newBooking;
};

// 3. Check localStorage data
const checkLocalStorageData = () => {
  console.log('🔍 Checking localStorage data...');
  
  const userBookings = localStorage.getItem('userBookings');
  const queueData = localStorage.getItem('salon_queue_data');
  
  console.log('👤 User Bookings:', userBookings ? JSON.parse(userBookings) : 'None');
  console.log('🏪 Queue Data:', queueData ? JSON.parse(queueData) : 'None');
};

// 4. Clear all test data
const clearTestData = () => {
  localStorage.removeItem('userBookings');
  localStorage.removeItem('salon_queue_data');
  console.log('🧹 Cleared all test data');
};

// Make functions available globally
window.debugPayment = {
  checkSalonInList,
  simulatePaymentSuccess,
  checkLocalStorageData,
  clearTestData
};

console.log('🧪 Debug Payment Flow Functions Available:');
console.log('- debugPayment.checkSalonInList()');
console.log('- debugPayment.simulatePaymentSuccess()');
console.log('- debugPayment.checkLocalStorageData()');
console.log('- debugPayment.clearTestData()');
console.log('');
console.log('💡 Try: debugPayment.simulatePaymentSuccess()');
// Simple Bookings Test - Run in Browser Console on Customer App

// Test 1: Add a booking directly to localStorage and reload
const addTestBooking = () => {
  console.log('🧪 Adding test booking...');

  const testBooking = {
    id: 'test_booking_' + Date.now(),
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
    status: 'waiting', // This should show in "Ongoing" tab
    paymentId: 'pay_test_' + Date.now(),
    createdAt: new Date().toISOString(),
    joinedAt: new Date(),
    queuePosition: 1,
    estimatedWaitTime: 25,
    isPrepaid: true
  };

  // Get existing bookings
  const existingBookings = JSON.parse(localStorage.getItem('userBookings') || '[]');
  console.log('📚 Existing bookings:', existingBookings);

  // Add new booking
  existingBookings.unshift(testBooking);
  localStorage.setItem('userBookings', JSON.stringify(existingBookings));

  console.log('💾 Saved bookings:', existingBookings);
  console.log('✅ Test booking added! Reloading page...');

  // Reload page to see changes
  location.reload();
};

// Test 2: Check current localStorage data
const checkBookingsData = () => {
  console.log('🔍 Checking bookings data...');

  const userBookings = localStorage.getItem('userBookings');
  console.log('📚 Raw localStorage data:', userBookings);

  if (userBookings) {
    const parsed = JSON.parse(userBookings);
    console.log('📚 Parsed bookings:', parsed);
    console.log('📊 Total bookings:', parsed.length);

    parsed.forEach((booking, index) => {
      console.log(`${index + 1}. ${booking.customerName} - ${booking.salonName} - Status: ${booking.status}`);
    });
  } else {
    console.log('❌ No bookings found in localStorage');
  }
};

// Test 3: Clear all bookings
const clearBookings = () => {
  localStorage.removeItem('userBookings');
  console.log('🧹 Cleared all bookings');
  location.reload();
};

// Test 4: Check if My Bookings button shows correct count
const checkBookingsButton = () => {
  const button = document.querySelector('.bookings-btn');
  if (button) {
    console.log('🔘 My Bookings button text:', button.textContent);
  } else {
    console.log('❌ My Bookings button not found');
  }
};

// Make functions available globally
window.testBookings = {
  addTestBooking,
  checkBookingsData,
  clearBookings,
  checkBookingsButton
};

console.log('🧪 Bookings Test Functions Available:');
console.log('- testBookings.addTestBooking() - Add a test booking');
console.log('- testBookings.checkBookingsData() - Check localStorage');
console.log('- testBookings.clearBookings() - Clear all bookings');
console.log('- testBookings.checkBookingsButton() - Check button');
console.log('');
console.log('💡 Try: testBookings.addTestBooking()');
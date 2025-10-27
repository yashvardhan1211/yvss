# 🔧 Force Bookings Test

## 🎯 **Let's Force It To Work**

### **Step 1: Open Customer App**
1. Go to `http://localhost:3000`
2. Open browser console (F12)

### **Step 2: Force Add Booking & Trigger React Update**
Copy and paste this code in console:

```javascript
// Force add booking and trigger React state update
const forceAddBooking = () => {
  console.log('🔧 Force adding booking...');
  
  // Create test booking
  const testBooking = {
    id: 'force_test_' + Date.now(),
    salonId: 'salon_iitp_hair',
    salonName: 'Elite Hair Studio IITP',
    customerName: 'Force Test User',
    customerPhone: '+91 9999999999',
    customerEmail: 'force@test.com',
    selectedServices: [
      { name: 'Haircut', price: 300, duration: 30 }
    ],
    totalAmount: 300,
    totalDuration: 30,
    type: 'queue',
    status: 'waiting',
    paymentId: 'pay_force_' + Date.now(),
    createdAt: new Date().toISOString(),
    isPrepaid: true
  };
  
  // Add to localStorage
  const bookings = JSON.parse(localStorage.getItem('userBookings') || '[]');
  bookings.unshift(testBooking);
  localStorage.setItem('userBookings', JSON.stringify(bookings));
  
  console.log('💾 Added to localStorage:', bookings);
  
  // Try to trigger React state update by dispatching a custom event
  window.dispatchEvent(new CustomEvent('forceBookingsUpdate', {
    detail: { bookings }
  }));
  
  console.log('📡 Dispatched custom event');
  
  // Also try to find and click the My Bookings button to see current count
  const button = document.querySelector('.bookings-btn');
  if (button) {
    console.log('🔘 Found My Bookings button:', button.textContent);
  } else {
    console.log('❌ My Bookings button not found');
    
    // List all buttons to see what's available
    const allButtons = document.querySelectorAll('button');
    console.log('🔘 All buttons found:', Array.from(allButtons).map(b => b.textContent));
  }
  
  // Force reload as last resort
  setTimeout(() => {
    console.log('🔄 Force reloading page...');
    location.reload();
  }, 2000);
};

// Run the test
forceAddBooking();
```

### **Step 3: Check Results**
After running the code:
1. **Wait 2 seconds** for auto-reload
2. **Look for "My Bookings" button** in header
3. **Check if it shows (1)** 
4. **Click the button** to open modal

### **Step 4: If Still Not Working**
Run this to check what's happening:

```javascript
// Debug everything
console.log('🔍 Debug Info:');
console.log('localStorage userBookings:', localStorage.getItem('userBookings'));
console.log('All buttons:', Array.from(document.querySelectorAll('button')).map(b => b.textContent));
console.log('Header actions:', document.querySelector('.header-actions'));
console.log('Current URL:', window.location.href);
```

### **Step 5: Nuclear Option**
If nothing works, try this complete reset:

```javascript
// Nuclear reset
localStorage.clear();
sessionStorage.clear();
location.reload();
```

Then manually add booking again after reload.

---

**Try Step 2 first and tell me what you see in the console!** 🔍
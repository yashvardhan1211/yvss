# 🐛 Debug Payment & Booking Issue

## 🎯 **Let's Debug Step by Step**

### **Step 1: Test if Salon Appears**
1. **Go to customer app:** `http://localhost:3000`
2. **Set location:** Enter "IIT Patna" or "Patna"
3. **Check:** Does "Elite Hair Studio IITP" appear in results?

### **Step 2: Test Payment Flow**
1. **Open browser console** (F12)
2. **Copy and paste this code:**
   ```javascript
   // Quick test - simulate successful payment
   const testBooking = {
     id: 'test_' + Date.now(),
     salonId: 'salon_iitp_hair',
     salonName: 'Elite Hair Studio IITP',
     customerName: 'Debug User',
     customerPhone: '+91 9999999999',
     selectedServices: [{name: 'Haircut', price: 300}],
     totalAmount: 300,
     status: 'waiting',
     createdAt: new Date().toISOString(),
     isPrepaid: true
   };
   
   // Add to user bookings
   const userBookings = JSON.parse(localStorage.getItem('userBookings') || '[]');
   userBookings.unshift(testBooking);
   localStorage.setItem('userBookings', JSON.stringify(userBookings));
   
   // Add to queue data
   const queueData = JSON.parse(localStorage.getItem('salon_queue_data') || '{}');
   queueData['salon_iitp_hair'] = queueData['salon_iitp_hair'] || [];
   queueData['salon_iitp_hair'].push(testBooking);
   localStorage.setItem('salon_queue_data', JSON.stringify(queueData));
   
   // Trigger update
   window.dispatchEvent(new StorageEvent('storage', {
     key: 'salon_queue_data',
     newValue: JSON.stringify(queueData)
   }));
   
   console.log('✅ Test booking created!');
   location.reload(); // Refresh to see changes
   ```

### **Step 3: Check Results**
1. **Customer App:** Click "My Bookings" - should show 1 booking
2. **Owner Dashboard:** Login and check queue - should show new customer

### **Step 4: Debug Console Logs**
When you join queue, check browser console for:
- `🎯 Queue joined with data:`
- `🏪 Salon data:`
- `🔍 Salon ID for queue update:`
- `💾 Updated localStorage with:`

### **Step 5: Manual Check**
1. **Open browser console**
2. **Check localStorage:**
   ```javascript
   console.log('User Bookings:', localStorage.getItem('userBookings'));
   console.log('Queue Data:', localStorage.getItem('salon_queue_data'));
   ```

## 🔧 **Common Issues & Fixes**

### **Issue 1: Salon Not Appearing**
- **Check:** Location set to Patna/IIT Patna area
- **Fix:** Try different location or refresh page

### **Issue 2: Payment Not Completing**
- **Check:** Console for payment errors
- **Fix:** Use test payment (skip actual Razorpay)

### **Issue 3: Owner Dashboard Not Updating**
- **Check:** Console logs in owner dashboard
- **Fix:** Refresh owner dashboard page

### **Issue 4: Bookings Not Showing**
- **Check:** localStorage has data
- **Fix:** Refresh customer app page

## 🧪 **Quick Test Commands**

**In Customer App Console:**
```javascript
// Check if salon exists
document.querySelector('.salon-name')?.textContent

// Check bookings count
JSON.parse(localStorage.getItem('userBookings') || '[]').length

// Simulate booking
// (Use code from Step 2 above)
```

**In Owner Dashboard Console:**
```javascript
// Check queue data
JSON.parse(localStorage.getItem('salon_queue_data') || '{}')

// Check owner salon ID
// Should be 'salon_iitp_hair'
```

## ✅ **Expected Results**

After successful payment:
- ✅ Customer sees booking in "My Bookings"
- ✅ Owner sees new customer in queue
- ✅ Queue count increases
- ✅ Revenue updates
- ✅ Console shows success logs

## 🚨 **If Still Not Working**

1. **Clear all data:**
   ```javascript
   localStorage.clear();
   location.reload();
   ```

2. **Try the manual test** from Step 2

3. **Check browser compatibility** (use Chrome/Firefox)

4. **Restart the app:** Stop `npm start` and restart

---

**Let me know what you see in the console logs!** 🔍
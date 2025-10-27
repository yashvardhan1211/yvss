# 🧪 Test Your Salon App - Elite Hair Studio IITP

## 🚀 Quick Start Testing

### 1. **Start the App**
```bash
npm start
```

### 2. **Test Owner Login**
1. Go to: `http://localhost:3000/owner`
2. Use these credentials:
   - **Email:** `owner@iitp-salon.com`
   - **Password:** `test123`

### 3. **Your Test Salon Details**
- **Name:** Elite Hair Studio IITP
- **Location:** Near Main Gate, IIT Patna, Bihta, Patna - 801106
- **Services:** 6 services (Haircuts, Beard Trim, Hair Wash, etc.)
- **Current Queue:** 3 customers waiting
- **Today's Revenue:** ₹3,600

## 🎯 **What You Can Test**

### **Owner Dashboard Features:**
1. **Queue Management**
   - View current queue (3 customers)
   - Add/remove customers
   - Update wait times
   - Mark services as complete

2. **Service Management**
   - View all 6 services
   - Edit prices and durations
   - Add new services
   - Manage service categories

3. **Real-time Stats**
   - Today's customers: 12
   - Revenue: ₹3,600
   - Average wait time: 25 mins
   - Live queue updates

4. **Customer Management**
   - View waiting customers:
     - Amit Singh (Men's Haircut + Beard Trim)
     - Priya Sharma (Women's Haircut) - In Progress
     - Rohit Kumar (Hair Wash + Facial)

### **Customer App Features:**
1. **Search Salons**
   - Your salon appears in search results
   - Shows live queue status
   - Displays services and pricing

2. **Join Queue**
   - Customers can join your salon's queue
   - Real-time position updates
   - Estimated wait time

3. **Book Services**
   - Select from your 6 services
   - Make payments
   - Get confirmation

## 🔧 **Test Scenarios**

### **Scenario 1: Manage Queue**
1. Login as owner
2. Go to Queue tab
3. Try these actions:
   - Mark "Priya Sharma" as completed
   - Add a new customer to queue
   - Update wait times

### **Scenario 2: Update Services**
1. Go to Services tab
2. Edit a service price
3. Add a new service
4. Change service duration

### **Scenario 3: View Analytics**
1. Check today's stats
2. View customer history
3. Monitor revenue

### **Scenario 4: Customer Experience**
1. Open new tab: `http://localhost:3000`
2. Search for salons near IIT Patna
3. Find "Elite Hair Studio IITP"
4. Join queue or book service

## 📱 **Mobile Testing**
- Test on mobile browser
- Check responsive design
- Try touch interactions

## 🎨 **UI Testing**
- Check the clean, modern design
- Test hover effects
- Verify mobile responsiveness
- Test dark/light themes

## 🔄 **Real-time Features**
- Queue updates in real-time
- Live customer notifications
- Instant status changes
- WebSocket connections

## 💡 **Pro Tips**
1. **Open Multiple Tabs:** One for owner dashboard, one for customer app
2. **Test Real-time:** Make changes in owner dashboard, see updates in customer app
3. **Mobile First:** Test on mobile devices for best experience
4. **Check Console:** Look for WebSocket connections and real-time updates

## 🐛 **If Something Doesn't Work**
1. Check browser console for errors
2. Refresh the page
3. Clear browser cache
4. Make sure all dependencies are installed: `npm install`

## 🎯 **Success Criteria**
✅ Owner can login successfully  
✅ Dashboard shows salon data  
✅ Queue management works  
✅ Services can be edited  
✅ Real-time updates work  
✅ Customer app shows salon  
✅ Mobile responsive design  

---

**Happy Testing! 🚀**

Your salon "Elite Hair Studio IITP" is ready for business!
# 🚀 Real-Time Salon Queue Integration

## Overview

This document explains how the salon owner dashboard and customer app are integrated for real-time queue updates using WebSocket technology.

## 🏗️ Architecture

```
┌─────────────────┐    WebSocket    ┌─────────────────┐    WebSocket    ┌─────────────────┐
│   Customer App  │ ◄──────────────► │  WebSocket      │ ◄──────────────► │  Owner Dashboard│
│                 │                  │  Server         │                  │                 │
│ - Join Queue    │                  │                 │                  │ - Manage Queue  │
│ - Get Updates   │                  │ - Real-time     │                  │ - Staff Control │
│ - Notifications │                  │   Broadcasting  │                  │ - Appointments  │
└─────────────────┘                  │ - Queue State   │                  └─────────────────┘
                                     │ - Customer Data │
                                     └─────────────────┘
```

## 🔄 Real-Time Features

### For Customers:
- **Live Queue Updates**: See real-time queue length and wait times
- **Position Tracking**: Get notified when position changes
- **Turn Notifications**: Browser and push notifications when it's your turn
- **Service Completion**: Automatic removal from queue when service is done
- **Connection Status**: Visual indicators for connection status

### For Salon Owners:
- **Customer Management**: See all customers in queue with details
- **Staff Coordination**: Assign and track staff availability
- **Appointment Integration**: Convert appointments to queue entries
- **Payment Tracking**: Real-time payment notifications
- **Queue Analytics**: Live statistics and performance metrics

## 📡 WebSocket Events

### Customer → Server Events:
```javascript
// Join the queue
socket.emit('join-queue', {
  customerName: 'John Doe',
  customerPhone: '+91 98765 43210',
  salonId: 'salon_123',
  selectedServices: [...],
  totalAmount: 500,
  totalDuration: 60
});

// Leave the queue
socket.emit('leave-queue', {
  customerId: 'customer_123',
  salonId: 'salon_123'
});

// Create appointment booking
socket.emit('create-booking', {
  customerName: 'Jane Smith',
  salonId: 'salon_123',
  selectedServices: [...],
  preferredTime: '2:30 PM',
  totalAmount: 800
});
```

### Server → Customer Events:
```javascript
// Queue position updates
socket.on('queue-joined', (data) => {
  // Customer successfully joined queue
  console.log(`Position: ${data.position}, Wait: ${data.estimatedWaitTime}min`);
});

socket.on('position-updated', (data) => {
  // Position changed in queue
  console.log(`New position: ${data.position}`);
});

socket.on('your-turn', (data) => {
  // It's customer's turn
  showNotification("It's your turn!");
});

socket.on('service-completed', (data) => {
  // Service finished, removed from queue
  console.log('Service completed, thank you!');
});
```

### Owner → Server Events:
```javascript
// Complete a customer's service
socket.emit('complete-service', {
  customerId: 'customer_123',
  salonId: 'salon_123'
});

// Update staff availability
socket.emit('update-staff-status', {
  staffId: 'staff_1',
  salonId: 'salon_123',
  isAvailable: false
});

// Convert appointment to queue
socket.emit('appointment-to-queue', {
  appointmentId: 'apt_123',
  salonId: 'salon_123'
});
```

### Server → Owner Events:
```javascript
// New customer joined queue
socket.on('customer-joined-queue', (data) => {
  console.log(`${data.customer.customerName} joined queue`);
  updateQueueDisplay(data);
});

// Queue updated
socket.on('queue-updated', (data) => {
  console.log(`Queue now has ${data.currentQueue} customers`);
  updateDashboard(data);
});

// New appointment booking
socket.on('new-booking', (data) => {
  console.log(`New booking from ${data.customerName}`);
  addToAppointments(data);
});
```

## 🎯 Implementation Details

### 1. WebSocket Server (Node.js + Socket.IO)

**Location**: `websocket-server/server.js`

Key features:
- Room-based communication (salon rooms, customer rooms)
- Real-time queue state management
- Appointment and customer data storage
- Broadcasting updates to relevant users
- RESTful API endpoints for integration

### 2. Customer App Integration

**Hook**: `src/hooks/useRealTimeQueue.js`
**Service**: `src/services/websocketService.js`
**Component**: `src/components/SalonDetails.js`

Key features:
- Automatic connection management
- Queue state synchronization
- Browser notifications
- Offline mode handling
- Persistent queue status

### 3. Owner Dashboard Integration

**Component**: `src/components/OwnerDashboard.js`
**Styles**: `src/components/OwnerDashboard.css`

Key features:
- Multi-tab interface (Queue, Appointments, Staff, etc.)
- Real-time customer management
- Staff scheduling and availability
- Payment processing integration
- Analytics and reporting

## 🔧 Setup Instructions

### 1. Start WebSocket Server
```bash
cd websocket-server
npm install
npm start
# Server runs on http://localhost:3001
```

### 2. Configure Environment Variables
```bash
# In .env file
REACT_APP_WEBSOCKET_URL=ws://localhost:3001
```

### 3. Start React App
```bash
npm install
npm start
# App runs on http://localhost:3000
```

## 📱 Usage Flow

### Customer Journey:
1. **Browse Salons**: Customer finds salon on map
2. **Check Queue**: See real-time queue status
3. **Join Queue**: Select services and join virtually
4. **Get Updates**: Receive position updates and notifications
5. **Your Turn**: Get notified when it's time to visit
6. **Service Complete**: Automatically removed from queue

### Owner Journey:
1. **Dashboard Login**: Access owner dashboard
2. **Monitor Queue**: See all customers in real-time
3. **Manage Staff**: Update staff availability and assignments
4. **Process Customers**: Start work, complete services, receive payments
5. **Handle Appointments**: Convert bookings to queue entries
6. **Analytics**: View performance metrics and insights

## 🔔 Notification System

### Browser Notifications:
- Position updates (when close to turn)
- Turn notifications (with sound and vibration)
- Service completion confirmations
- Queue status changes

### Toast Notifications:
- Real-time queue updates
- Connection status changes
- Action confirmations
- Error messages

### Visual Indicators:
- Live connection status
- Queue position badges
- Staff availability indicators
- Payment status updates

## 🛡️ Error Handling & Resilience

### Connection Management:
- Automatic reconnection with exponential backoff
- Offline mode with cached data
- Connection status indicators
- Graceful degradation

### Data Persistence:
- LocalStorage for queue status
- Session recovery on reconnection
- Backup REST API endpoints
- State synchronization

### Error Recovery:
- Failed operation retry logic
- User-friendly error messages
- Fallback to manual operations
- Data consistency checks

## 📊 Performance Considerations

### Optimization Strategies:
- Room-based event broadcasting (only relevant users)
- Debounced position updates
- Efficient data structures
- Connection pooling

### Scalability:
- Horizontal scaling with Redis adapter
- Load balancing for WebSocket connections
- Database integration for persistence
- CDN for static assets

## 🧪 Testing

### Manual Testing:
1. Open multiple browser tabs (customer + owner)
2. Join queue from customer tab
3. Verify real-time updates in owner dashboard
4. Test all queue operations (join, leave, complete)
5. Check notifications and visual feedback

### API Testing:
```bash
# Check server status
curl http://localhost:3001/api/status

# Get salon queue data
curl http://localhost:3001/api/salons/salon_1/queue

# Update queue manually
curl -X POST http://localhost:3001/api/salons/salon_1/queue \
  -H "Content-Type: application/json" \
  -d '{"change": 1}'
```

## 🚀 Deployment

### Production Considerations:
- Use secure WebSocket connections (WSS)
- Configure CORS properly
- Set up SSL certificates
- Use environment-specific configurations
- Monitor connection health
- Implement rate limiting
- Add authentication/authorization

### Environment Variables:
```bash
# Production
REACT_APP_WEBSOCKET_URL=wss://your-domain.com
NODE_ENV=production
PORT=3001

# Development
REACT_APP_WEBSOCKET_URL=ws://localhost:3001
NODE_ENV=development
PORT=3001
```

## 📈 Future Enhancements

### Planned Features:
- SMS notifications integration
- Advanced analytics dashboard
- Multi-location support
- Staff performance tracking
- Customer loyalty program
- Automated scheduling
- Payment gateway integration
- Mobile app development

### Technical Improvements:
- Redis for session storage
- Database integration (MongoDB/PostgreSQL)
- Microservices architecture
- Docker containerization
- Kubernetes deployment
- Monitoring and logging
- Performance optimization
- Security enhancements

---

This real-time integration provides a seamless experience for both salon owners and customers, ensuring efficient queue management and excellent customer service! 🎉
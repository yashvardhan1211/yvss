# 🚀 Real-Time Salon Management System

A comprehensive salon management system with real-time queue updates, appointment booking, and seamless communication between customers and salon owners.

## 🌟 Features

### For Customers 👤
- **Real-Time Queue Updates** - See live queue status and wait times
- **Virtual Queue Joining** - Join queues remotely without physical presence
- **Position Tracking** - Get notified when your position changes
- **Turn Notifications** - Browser notifications when it's your turn
- **Service Booking** - Book appointments with preferred time slots
- **Payment Integration** - Secure online payments via Razorpay

### For Salon Owners 💼
- **Live Dashboard** - Real-time customer management interface
- **Queue Management** - Add, remove, and reorder customers
- **Staff Coordination** - Track staff availability and assignments
- **Appointment System** - Manage bookings and convert to queue entries
- **Analytics** - Performance metrics and business insights
- **Payment Tracking** - Real-time payment notifications

### Technical Features 🔧
- **WebSocket Integration** - Real-time bidirectional communication
- **Offline Support** - Graceful degradation when connection is lost
- **Auto-Reconnection** - Automatic reconnection with exponential backoff
- **Data Persistence** - Queue status saved in localStorage
- **Mobile Responsive** - Works seamlessly on all devices

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

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)
```bash
# Make the startup script executable
chmod +x start-realtime-system.sh

# Start everything
./start-realtime-system.sh start

# Check status
./start-realtime-system.sh status

# Run tests
./start-realtime-system.sh test

# Stop everything
./start-realtime-system.sh stop
```

### Option 2: Manual Setup

#### 1. Start WebSocket Server
```bash
cd websocket-server
npm install
npm start
# Server runs on http://localhost:3001
```

#### 2. Start React App
```bash
npm install
npm start
# App runs on http://localhost:3000
```

#### 3. Configure Environment
```bash
# Create .env file
echo "REACT_APP_WEBSOCKET_URL=ws://localhost:3001" > .env
```

## 📱 Usage Guide

### Customer Journey
1. **Find Salon** - Browse salons on the map
2. **Check Queue** - See real-time queue status and wait times
3. **Join Queue** - Select services and join virtually
4. **Get Updates** - Receive position updates and notifications
5. **Your Turn** - Get notified when it's time to visit
6. **Complete Service** - Automatically removed from queue

### Owner Journey
1. **Login** - Access the owner dashboard
2. **Monitor Queue** - See all customers in real-time
3. **Manage Staff** - Update availability and assignments
4. **Process Customers** - Start work, complete services, receive payments
5. **Handle Appointments** - Convert bookings to queue entries
6. **View Analytics** - Monitor performance and insights

## 🔧 API Reference

### WebSocket Events

#### Customer Events
```javascript
// Join queue
socket.emit('join-queue', {
  customerName: 'John Doe',
  customerPhone: '+91 98765 43210',
  salonId: 'salon_123',
  selectedServices: [...],
  totalAmount: 500,
  totalDuration: 60
});

// Leave queue
socket.emit('leave-queue', {
  customerId: 'customer_123',
  salonId: 'salon_123'
});
```

#### Owner Events
```javascript
// Complete service
socket.emit('complete-service', {
  customerId: 'customer_123',
  salonId: 'salon_123'
});

// Update staff status
socket.emit('update-staff-status', {
  staffId: 'staff_1',
  salonId: 'salon_123',
  isAvailable: false
});
```

### REST API Endpoints

```bash
# Get server status
GET /api/status

# Get all salons
GET /api/salons

# Get specific salon
GET /api/salons/:id

# Get salon queue
GET /api/salons/:id/queue

# Update queue
POST /api/salons/:id/queue
Content-Type: application/json
{
  "change": 1
}

# Get customer queue status
GET /api/customers/:customerId/queue

# Get appointments
GET /api/appointments
```

## 🧪 Testing

### Automated Testing
```bash
# Run the interactive test suite
./start-realtime-system.sh test

# Or manually
node test-realtime.js
```

### Manual Testing
1. Open multiple browser tabs
2. Use one as customer, another as owner
3. Join queue from customer tab
4. Verify updates appear in owner dashboard
5. Complete service from owner side
6. Check notifications in customer tab

### API Testing
```bash
# Check server status
curl http://localhost:3001/api/status

# Get salon data
curl http://localhost:3001/api/salons/salon_1

# Update queue
curl -X POST http://localhost:3001/api/salons/salon_1/queue \
  -H "Content-Type: application/json" \
  -d '{"change": 1}'
```

## 📊 Monitoring & Analytics

### Real-Time Metrics
- Active connections
- Queue lengths across salons
- Average wait times
- Customer satisfaction rates
- Revenue tracking

### Performance Monitoring
```bash
# Check WebSocket server status
curl http://localhost:3001/api/status

# Response includes:
{
  "status": "running",
  "connectedUsers": 15,
  "salons": 3,
  "totalCustomersInQueue": 8,
  "totalAppointments": 12,
  "uptime": 3600,
  "timestamp": "2024-01-20T10:30:00.000Z"
}
```

## 🔒 Security Considerations

### Production Deployment
- Use HTTPS/WSS for secure connections
- Implement authentication and authorization
- Add rate limiting for API endpoints
- Validate all input data
- Use environment variables for sensitive config
- Enable CORS properly for your domain

### Environment Variables
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

## 🚀 Deployment

### Docker Deployment
```dockerfile
# Dockerfile for WebSocket server
FROM node:16-alpine
WORKDIR /app
COPY websocket-server/package*.json ./
RUN npm install
COPY websocket-server/ ./
EXPOSE 3001
CMD ["npm", "start"]
```

### Cloud Deployment
- **Heroku**: Use the included Procfile
- **AWS**: Deploy with Elastic Beanstalk or ECS
- **Google Cloud**: Use App Engine or Cloud Run
- **DigitalOcean**: Use App Platform

## 🛠️ Development

### Project Structure
```
├── src/
│   ├── components/
│   │   ├── OwnerDashboard.js     # Owner interface
│   │   ├── SalonDetails.js       # Customer interface
│   │   └── ...
│   ├── hooks/
│   │   └── useRealTimeQueue.js   # Real-time queue hook
│   ├── services/
│   │   ├── websocketService.js   # WebSocket client
│   │   └── salonService.js       # API service
│   └── ...
├── websocket-server/
│   └── server.js                 # WebSocket server
├── test-realtime.js              # Integration tests
├── start-realtime-system.sh      # Startup script
└── README_REALTIME.md           # This file
```

### Adding New Features

#### 1. Add WebSocket Event
```javascript
// In websocket-server/server.js
socket.on('new-event', (data) => {
  // Handle event
  io.to(`salon_${data.salonId}`).emit('event-response', result);
});
```

#### 2. Add Client Handler
```javascript
// In src/services/websocketService.js
this.socket.on('event-response', (data) => {
  window.dispatchEvent(new CustomEvent('eventResponse', { detail: data }));
});
```

#### 3. Use in Component
```javascript
// In React component
useEffect(() => {
  const handleEvent = (event) => {
    console.log('Event received:', event.detail);
  };
  
  window.addEventListener('eventResponse', handleEvent);
  return () => window.removeEventListener('eventResponse', handleEvent);
}, []);
```

## 🐛 Troubleshooting

### Common Issues

#### WebSocket Connection Failed
```bash
# Check if server is running
curl http://localhost:3001/api/status

# Check firewall settings
sudo ufw status

# Check port availability
lsof -i :3001
```

#### Real-Time Updates Not Working
1. Verify WebSocket connection in browser dev tools
2. Check console for error messages
3. Ensure both client and server are on same network
4. Verify CORS settings in server

#### Performance Issues
1. Monitor connection count: `curl http://localhost:3001/api/status`
2. Check memory usage: `ps aux | grep node`
3. Monitor network traffic
4. Consider implementing connection pooling

### Debug Mode
```bash
# Enable debug logging
DEBUG=socket.io* node websocket-server/server.js

# Or set environment variable
export DEBUG=socket.io*
npm start
```

## 📈 Future Enhancements

### Planned Features
- [ ] SMS notifications integration
- [ ] Advanced analytics dashboard
- [ ] Multi-location support
- [ ] Staff performance tracking
- [ ] Customer loyalty program
- [ ] Automated scheduling
- [ ] Mobile app (React Native)
- [ ] Voice notifications
- [ ] AI-powered wait time predictions

### Technical Improvements
- [ ] Redis for session storage
- [ ] Database integration (MongoDB/PostgreSQL)
- [ ] Microservices architecture
- [ ] Docker containerization
- [ ] Kubernetes deployment
- [ ] Load balancing
- [ ] CDN integration
- [ ] Performance monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Socket.IO for real-time communication
- React for the user interface
- Firebase for backend services
- Razorpay for payment processing
- Google Maps API for location services

---

**Happy Coding! 🎉**

For questions or support, please open an issue or contact the development team.
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Configure CORS for Socket.IO
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:3000", "https://your-app-domain.com"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(cors());
app.use(express.json());

// Store connected users and salon data
const connectedUsers = new Map();
const salonRooms = new Map();
const salonData = new Map();

// Initialize some sample salon data
salonData.set('salon_1', {
  id: 'salon_1',
  name: 'Beauty Palace',
  currentQueue: 3,
  estimatedWaitTime: 15,
  isOpen: true
});

salonData.set('salon_2', {
  id: 'salon_2',
  name: 'Style Studio',
  currentQueue: 5,
  estimatedWaitTime: 25,
  isOpen: true
});

io.on('connection', (socket) => {
  console.log(`✅ User connected: ${socket.id}`);
  
  const { userId, userType } = socket.handshake.query;
  
  // Store user info
  connectedUsers.set(socket.id, {
    userId,
    userType,
    socketId: socket.id,
    connectedAt: new Date()
  });

  console.log(`👤 ${userType} ${userId} connected`);

  // Join user to their personal room
  socket.join(`user_${userId}`);

  // Handle joining salon rooms
  socket.on('join-salon-room', ({ salonId }) => {
    socket.join(`salon_${salonId}`);
    console.log(`🏪 User ${userId} joined salon room: ${salonId}`);
    
    // Send current salon data
    const salon = salonData.get(salonId);
    if (salon) {
      socket.emit('salon-data', salon);
    }
  });

  // Handle leaving salon rooms
  socket.on('leave-salon-room', ({ salonId }) => {
    socket.leave(`salon_${salonId}`);
    console.log(`🚪 User ${userId} left salon room: ${salonId}`);
  });

  // Handle queue updates
  socket.on('update-queue', ({ salonId, change }) => {
    console.log(`📊 Queue update for salon ${salonId}: ${change > 0 ? '+' : ''}${change}`);
    
    const salon = salonData.get(salonId);
    if (salon) {
      salon.currentQueue = Math.max(0, salon.currentQueue + change);
      salon.estimatedWaitTime = Math.max(5, salon.currentQueue * 5);
      salon.updatedAt = new Date();
      
      // Broadcast to all users in salon room
      io.to(`salon_${salonId}`).emit('queue-updated', {
        salonId,
        salonName: salon.name,
        currentQueue: salon.currentQueue,
        estimatedWaitTime: salon.estimatedWaitTime,
        change
      });
      
      console.log(`✅ Queue updated: ${salon.name} now has ${salon.currentQueue} people`);
    }
  });

  // Handle new bookings
  socket.on('create-booking', (bookingData) => {
    console.log(`📅 New booking created:`, bookingData);
    
    // Notify salon owner
    io.to(`salon_${bookingData.salonId}`).emit('new-booking', {
      customerName: bookingData.customerName,
      service: bookingData.selectedServices.map(s => s.name).join(', '),
      time: bookingData.preferredTime,
      totalAmount: bookingData.totalAmount,
      bookingId: bookingData.bookingId
    });
    
    // Confirm booking to customer
    socket.emit('booking-confirmed', {
      salonName: bookingData.salonName,
      bookingTime: bookingData.preferredTime,
      bookingId: bookingData.bookingId
    });
    
    // Update queue
    const salon = salonData.get(bookingData.salonId);
    if (salon) {
      salon.currentQueue += 1;
      salon.estimatedWaitTime = salon.currentQueue * 5;
    }
  });

  // Handle service completion
  socket.on('complete-service', ({ bookingId, salonId }) => {
    console.log(`✅ Service completed: ${bookingId}`);
    
    // Update queue
    const salon = salonData.get(salonId);
    if (salon) {
      salon.currentQueue = Math.max(0, salon.currentQueue - 1);
      salon.estimatedWaitTime = Math.max(5, salon.currentQueue * 5);
      
      // Broadcast queue update
      io.to(`salon_${salonId}`).emit('queue-updated', {
        salonId,
        salonName: salon.name,
        currentQueue: salon.currentQueue,
        estimatedWaitTime: salon.estimatedWaitTime,
        change: -1
      });
    }
    
    // Notify next customer if queue exists
    if (salon && salon.currentQueue > 0) {
      // In a real app, you'd get the next customer from database
      io.to(`salon_${salonId}`).emit('your-turn', {
        salonName: salon.name,
        message: "It's your turn!"
      });
    }
  });

  // Handle payment notifications
  socket.on('payment-received', ({ amount, salonId, bookingId }) => {
    console.log(`💰 Payment received: $${amount} for booking ${bookingId}`);
    
    const salon = salonData.get(salonId);
    if (salon) {
      // Notify salon owner
      io.to(`salon_${salonId}`).emit('payment-received', {
        amount,
        salonName: salon.name,
        bookingId
      });
    }
  });

  // Handle custom notifications
  socket.on('send-notification', ({ targetUserId, notification }) => {
    console.log(`🔔 Sending notification to ${targetUserId}:`, notification);
    
    io.to(`user_${targetUserId}`).emit('notification', notification);
  });

  // Handle salon status changes
  socket.on('toggle-salon-status', ({ salonId, isOpen }) => {
    console.log(`🏪 Salon ${salonId} status changed: ${isOpen ? 'OPEN' : 'CLOSED'}`);
    
    const salon = salonData.get(salonId);
    if (salon) {
      salon.isOpen = isOpen;
      salon.updatedAt = new Date();
      
      // Broadcast to all users in salon room
      io.to(`salon_${salonId}`).emit('salon-status-changed', {
        salonId,
        salonName: salon.name,
        isOpen
      });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    const user = connectedUsers.get(socket.id);
    if (user) {
      console.log(`❌ User disconnected: ${user.userType} ${user.userId}`);
      connectedUsers.delete(socket.id);
    }
  });

  // Send welcome message
  socket.emit('notification', {
    type: 'success',
    message: 'Connected to real-time updates!'
  });
});

// REST API endpoints for testing
app.get('/api/salons', (req, res) => {
  const salons = Array.from(salonData.values());
  res.json(salons);
});

app.post('/api/salons/:id/queue', (req, res) => {
  const { id } = req.params;
  const { change } = req.body;
  
  const salon = salonData.get(id);
  if (!salon) {
    return res.status(404).json({ error: 'Salon not found' });
  }
  
  salon.currentQueue = Math.max(0, salon.currentQueue + change);
  salon.estimatedWaitTime = Math.max(5, salon.currentQueue * 5);
  salon.updatedAt = new Date();
  
  // Broadcast update
  io.to(`salon_${id}`).emit('queue-updated', {
    salonId: id,
    salonName: salon.name,
    currentQueue: salon.currentQueue,
    estimatedWaitTime: salon.estimatedWaitTime,
    change
  });
  
  res.json(salon);
});

app.get('/api/status', (req, res) => {
  res.json({
    status: 'running',
    connectedUsers: connectedUsers.size,
    salons: salonData.size,
    uptime: process.uptime()
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 WebSocket server running on port ${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/api/status`);
});

// Simulate some real-time updates for demo
setInterval(() => {
  // Randomly update queue for demo
  if (Math.random() > 0.8) {
    const salonIds = Array.from(salonData.keys());
    const randomSalonId = salonIds[Math.floor(Math.random() * salonIds.length)];
    const salon = salonData.get(randomSalonId);
    
    if (salon && salon.isOpen) {
      const change = Math.random() > 0.5 ? 1 : -1;
      salon.currentQueue = Math.max(0, salon.currentQueue + change);
      salon.estimatedWaitTime = Math.max(5, salon.currentQueue * 5);
      
      io.to(`salon_${randomSalonId}`).emit('queue-updated', {
        salonId: randomSalonId,
        salonName: salon.name,
        currentQueue: salon.currentQueue,
        estimatedWaitTime: salon.estimatedWaitTime,
        change
      });
      
      console.log(`🎲 Demo update: ${salon.name} queue is now ${salon.currentQueue}`);
    }
  }
}, 30000); // Every 30 seconds
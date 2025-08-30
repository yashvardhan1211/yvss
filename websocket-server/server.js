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
    origin: [
      "http://localhost:3000",
      "http://localhost:3002",
      "http://localhost:3003",
      "https://your-app-domain.com"
    ],
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
const customerQueues = new Map(); // Store customer queue data
const appointments = new Map(); // Store appointment data

// Initialize some sample salon data
salonData.set('salon_1', {
  id: 'salon_1',
  name: 'Beauty Palace',
  currentQueue: 3,
  estimatedWaitTime: 15,
  isOpen: true,
  customers: [],
  staff: [
    { id: 1, name: 'Ravi Kumar', isAvailable: true },
    { id: 2, name: 'Priya Patel', isAvailable: true }
  ]
});

salonData.set('salon_2', {
  id: 'salon_2',
  name: 'Style Studio',
  currentQueue: 5,
  estimatedWaitTime: 25,
  isOpen: true,
  customers: [],
  staff: [
    { id: 1, name: 'Amit Singh', isAvailable: true },
    { id: 2, name: 'Sunita Sharma', isAvailable: false }
  ]
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
    
    // Store appointment
    const appointmentId = `apt_${Date.now()}`;
    appointments.set(appointmentId, {
      ...bookingData,
      id: appointmentId,
      status: 'confirmed',
      createdAt: new Date()
    });
    
    // Notify salon owner
    io.to(`salon_${bookingData.salonId}`).emit('new-booking', {
      id: appointmentId,
      customerName: bookingData.customerName,
      customerPhone: bookingData.customerPhone,
      service: bookingData.selectedServices.map(s => s.name).join(', '),
      services: bookingData.selectedServices,
      time: bookingData.preferredTime,
      totalAmount: bookingData.totalAmount,
      duration: bookingData.totalDuration,
      bookingId: appointmentId
    });
    
    // Confirm booking to customer
    socket.emit('booking-confirmed', {
      salonName: bookingData.salonName,
      bookingTime: bookingData.preferredTime,
      bookingId: appointmentId,
      appointmentId: appointmentId
    });
    
    console.log(`✅ Appointment ${appointmentId} created and notifications sent`);
  });

  // Handle joining queue (walk-in customers)
  socket.on('join-queue', (queueData) => {
    console.log(`🚶‍♂️ Customer joining queue:`, queueData);
    
    const salon = salonData.get(queueData.salonId);
    if (!salon) {
      socket.emit('queue-error', { message: 'Salon not found' });
      return;
    }

    // Create queue entry
    const queueEntry = {
      id: `queue_${Date.now()}`,
      customerId: queueData.customerId || `customer_${Date.now()}`,
      customerName: queueData.customerName,
      customerPhone: queueData.customerPhone,
      salonId: queueData.salonId,
      services: queueData.selectedServices,
      totalAmount: queueData.totalAmount,
      totalDuration: queueData.totalDuration,
      joinedAt: new Date(),
      status: 'waiting',
      position: salon.customers.length + 1,
      estimatedWaitTime: (salon.customers.length + 1) * 15
    };

    // Add to salon's customer queue
    salon.customers.push(queueEntry);
    salon.currentQueue = salon.customers.length;
    salon.estimatedWaitTime = salon.currentQueue * 15;

    // Store in customer queues map
    customerQueues.set(queueEntry.customerId, queueEntry);

    // Join customer to their personal room
    socket.join(`customer_${queueEntry.customerId}`);

    // Notify salon owner about new customer
    io.to(`salon_${queueData.salonId}`).emit('customer-joined-queue', {
      customer: queueEntry,
      queueLength: salon.currentQueue,
      estimatedWaitTime: salon.estimatedWaitTime
    });

    // Confirm queue join to customer
    socket.emit('queue-joined', {
      queueId: queueEntry.id,
      customerId: queueEntry.customerId,
      position: queueEntry.position,
      estimatedWaitTime: queueEntry.estimatedWaitTime,
      salonName: salon.name
    });

    // Broadcast queue update to all salon watchers
    io.to(`salon_${queueData.salonId}`).emit('queue-updated', {
      salonId: queueData.salonId,
      salonName: salon.name,
      currentQueue: salon.currentQueue,
      estimatedWaitTime: salon.estimatedWaitTime,
      customers: salon.customers
    });

    console.log(`✅ Customer ${queueEntry.customerName} joined queue at position ${queueEntry.position}`);
  });

  // Handle customer position updates
  socket.on('update-customer-position', ({ customerId, newPosition, salonId }) => {
    const salon = salonData.get(salonId);
    const queueEntry = customerQueues.get(customerId);
    
    if (salon && queueEntry) {
      // Update position in salon's customer list
      const customerIndex = salon.customers.findIndex(c => c.customerId === customerId);
      if (customerIndex !== -1) {
        salon.customers[customerIndex].position = newPosition;
        salon.customers[customerIndex].estimatedWaitTime = newPosition * 15;
        
        // Update in customer queues map
        queueEntry.position = newPosition;
        queueEntry.estimatedWaitTime = newPosition * 15;
        
        // Notify customer about position change
        io.to(`customer_${customerId}`).emit('position-updated', {
          position: newPosition,
          estimatedWaitTime: newPosition * 15,
          salonName: salon.name
        });

        // Notify if customer is next (position 1)
        if (newPosition === 1) {
          io.to(`customer_${customerId}`).emit('your-turn', {
            salonName: salon.name,
            message: "It's your turn! Please head to the salon now."
          });
        }
        
        console.log(`📍 Customer ${customerId} position updated to ${newPosition}`);
      }
    }
  });

  // Handle service completion
  socket.on('complete-service', ({ customerId, salonId }) => {
    console.log(`✅ Service completed for customer: ${customerId}`);
    
    const salon = salonData.get(salonId);
    if (!salon) return;

    // Remove customer from queue
    const customerIndex = salon.customers.findIndex(c => c.customerId === customerId);
    if (customerIndex !== -1) {
      const completedCustomer = salon.customers[customerIndex];
      salon.customers.splice(customerIndex, 1);
      
      // Remove from customer queues map
      customerQueues.delete(customerId);
      
      // Update positions for remaining customers
      salon.customers.forEach((customer, index) => {
        customer.position = index + 1;
        customer.estimatedWaitTime = (index + 1) * 15;
        
        // Update in customer queues map
        const queueEntry = customerQueues.get(customer.customerId);
        if (queueEntry) {
          queueEntry.position = index + 1;
          queueEntry.estimatedWaitTime = (index + 1) * 15;
        }
        
        // Notify customer of position change
        io.to(`customer_${customer.customerId}`).emit('position-updated', {
          position: customer.position,
          estimatedWaitTime: customer.estimatedWaitTime,
          salonName: salon.name
        });
      });
      
      // Update salon queue stats
      salon.currentQueue = salon.customers.length;
      salon.estimatedWaitTime = salon.currentQueue * 15;
      
      // Notify completed customer
      io.to(`customer_${customerId}`).emit('service-completed', {
        salonName: salon.name,
        customerName: completedCustomer.customerName,
        totalAmount: completedCustomer.totalAmount
      });
      
      // Broadcast queue update to all salon watchers
      io.to(`salon_${salonId}`).emit('queue-updated', {
        salonId,
        salonName: salon.name,
        currentQueue: salon.currentQueue,
        estimatedWaitTime: salon.estimatedWaitTime,
        customers: salon.customers,
        change: -1
      });
      
      // Notify next customer if queue exists
      if (salon.customers.length > 0) {
        const nextCustomer = salon.customers[0];
        io.to(`customer_${nextCustomer.customerId}`).emit('your-turn', {
          salonName: salon.name,
          message: "It's your turn! Please head to the salon now.",
          position: 1
        });
      }
      
      console.log(`✅ Service completed for ${completedCustomer.customerName}, queue updated`);
    }
  });

  // Handle customer leaving queue
  socket.on('leave-queue', ({ customerId, salonId }) => {
    console.log(`🚪 Customer leaving queue: ${customerId}`);
    
    const salon = salonData.get(salonId);
    if (!salon) return;

    const customerIndex = salon.customers.findIndex(c => c.customerId === customerId);
    if (customerIndex !== -1) {
      const leavingCustomer = salon.customers[customerIndex];
      salon.customers.splice(customerIndex, 1);
      
      // Remove from customer queues map
      customerQueues.delete(customerId);
      
      // Update positions for remaining customers
      salon.customers.forEach((customer, index) => {
        customer.position = index + 1;
        customer.estimatedWaitTime = (index + 1) * 15;
        
        // Update in customer queues map
        const queueEntry = customerQueues.get(customer.customerId);
        if (queueEntry) {
          queueEntry.position = index + 1;
          queueEntry.estimatedWaitTime = (index + 1) * 15;
        }
        
        // Notify customer of position change
        io.to(`customer_${customer.customerId}`).emit('position-updated', {
          position: customer.position,
          estimatedWaitTime: customer.estimatedWaitTime,
          salonName: salon.name
        });
      });
      
      // Update salon queue stats
      salon.currentQueue = salon.customers.length;
      salon.estimatedWaitTime = salon.currentQueue * 15;
      
      // Confirm to leaving customer
      socket.emit('queue-left', {
        salonName: salon.name,
        message: 'You have successfully left the queue'
      });
      
      // Broadcast queue update
      io.to(`salon_${salonId}`).emit('queue-updated', {
        salonId,
        salonName: salon.name,
        currentQueue: salon.currentQueue,
        estimatedWaitTime: salon.estimatedWaitTime,
        customers: salon.customers,
        change: -1
      });
      
      console.log(`✅ Customer ${leavingCustomer.customerName} left queue`);
    }
  });

  // Handle staff status updates
  socket.on('update-staff-status', ({ staffId, salonId, isAvailable }) => {
    console.log(`👨‍💼 Staff status update: ${staffId} - ${isAvailable ? 'Available' : 'Busy'}`);
    
    const salon = salonData.get(salonId);
    if (salon) {
      const staff = salon.staff.find(s => s.id === staffId);
      if (staff) {
        staff.isAvailable = isAvailable;
        
        // Broadcast staff update to salon
        io.to(`salon_${salonId}`).emit('staff-updated', {
          salonId,
          staffId,
          isAvailable,
          staffName: staff.name
        });
        
        console.log(`✅ Staff ${staff.name} marked as ${isAvailable ? 'available' : 'busy'}`);
      }
    }
  });

  // Handle appointment to queue conversion
  socket.on('appointment-to-queue', ({ appointmentId, salonId }) => {
    console.log(`📅➡️🚶‍♂️ Converting appointment to queue: ${appointmentId}`);
    
    const appointment = appointments.get(appointmentId);
    const salon = salonData.get(salonId);
    
    if (appointment && salon) {
      // Create queue entry from appointment
      const queueEntry = {
        id: `queue_${Date.now()}`,
        customerId: `customer_${Date.now()}`,
        customerName: appointment.customerName,
        customerPhone: appointment.customerPhone,
        salonId: appointment.salonId,
        services: appointment.selectedServices,
        totalAmount: appointment.totalAmount,
        totalDuration: appointment.totalDuration,
        joinedAt: new Date(),
        status: 'waiting',
        position: salon.customers.length + 1,
        estimatedWaitTime: (salon.customers.length + 1) * 15,
        fromAppointment: true,
        originalAppointmentId: appointmentId
      };

      // Add to salon's customer queue
      salon.customers.push(queueEntry);
      salon.currentQueue = salon.customers.length;
      salon.estimatedWaitTime = salon.currentQueue * 15;

      // Store in customer queues map
      customerQueues.set(queueEntry.customerId, queueEntry);

      // Remove appointment
      appointments.delete(appointmentId);

      // Broadcast updates
      io.to(`salon_${salonId}`).emit('appointment-converted-to-queue', {
        queueEntry,
        appointmentId
      });

      io.to(`salon_${salonId}`).emit('queue-updated', {
        salonId,
        salonName: salon.name,
        currentQueue: salon.currentQueue,
        estimatedWaitTime: salon.estimatedWaitTime,
        customers: salon.customers
      });

      console.log(`✅ Appointment ${appointmentId} converted to queue position ${queueEntry.position}`);
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

// REST API endpoints for testing and integration
app.get('/api/salons', (req, res) => {
  const salons = Array.from(salonData.values()).map(salon => ({
    ...salon,
    queueLength: salon.customers.length,
    waitTime: salon.estimatedWaitTime
  }));
  res.json(salons);
});

app.get('/api/salons/:id', (req, res) => {
  const { id } = req.params;
  const salon = salonData.get(id);
  
  if (!salon) {
    return res.status(404).json({ error: 'Salon not found' });
  }
  
  res.json({
    ...salon,
    queueLength: salon.customers.length,
    waitTime: salon.estimatedWaitTime
  });
});

app.get('/api/salons/:id/queue', (req, res) => {
  const { id } = req.params;
  const salon = salonData.get(id);
  
  if (!salon) {
    return res.status(404).json({ error: 'Salon not found' });
  }
  
  res.json({
    salonId: id,
    salonName: salon.name,
    currentQueue: salon.currentQueue,
    estimatedWaitTime: salon.estimatedWaitTime,
    customers: salon.customers,
    isOpen: salon.isOpen
  });
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
    customers: salon.customers,
    change
  });
  
  res.json({
    ...salon,
    queueLength: salon.customers.length,
    waitTime: salon.estimatedWaitTime
  });
});

app.get('/api/customers/:customerId/queue', (req, res) => {
  const { customerId } = req.params;
  const queueEntry = customerQueues.get(customerId);
  
  if (!queueEntry) {
    return res.status(404).json({ error: 'Customer not in queue' });
  }
  
  res.json(queueEntry);
});

app.get('/api/appointments', (req, res) => {
  const appointmentList = Array.from(appointments.values());
  res.json(appointmentList);
});

app.get('/api/appointments/:id', (req, res) => {
  const { id } = req.params;
  const appointment = appointments.get(id);
  
  if (!appointment) {
    return res.status(404).json({ error: 'Appointment not found' });
  }
  
  res.json(appointment);
});

app.get('/api/status', (req, res) => {
  res.json({
    status: 'running',
    connectedUsers: connectedUsers.size,
    salons: salonData.size,
    totalCustomersInQueue: Array.from(salonData.values()).reduce((total, salon) => total + salon.customers.length, 0),
    totalAppointments: appointments.size,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
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
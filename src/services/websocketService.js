import io from 'socket.io-client';
import toast from 'react-hot-toast';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 15; // Increased from 5 to allow more reconnection attempts
    this.userId = null;
    this.userType = null;
    
    // Add event listener for online/offline status
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
  }
  
  // Handle browser online event
  handleOnline() {
    console.log('🌐 Browser is online, attempting to reconnect WebSocket');
    toast.success('You are back online', {
      id: 'offline-toast',
      duration: 3000
    });
    
    if (this.userId) {
      this.reconnectAttempts = 0; // Reset reconnect attempts
      this.connect(this.userId, this.userType);
    }
  }
  
  // Handle browser offline event
  handleOffline() {
    console.log('🔌 Browser is offline, WebSocket connections will fail');
    toast.error('You are offline. Real-time features will be unavailable until connection is restored.', {
      id: 'offline-toast',
      duration: 0 // Persist until manually dismissed or connection restored
    });
    this.isConnected = false;
  }
  
  // Check if WebSocket is connected
  isSocketConnected() {
    return this.socket && this.socket.connected && this.isConnected;
  }

  connect(userId, userType = 'customer') {
    try {
      // Store userId and userType for reconnection
      this.userId = userId;
      this.userType = userType;
      
      // If already connected or connecting, don't create a new connection
      if (this.socket && (this.socket.connected || this.socket.connecting)) {
        console.log('WebSocket already connected or connecting');
        return;
      }
      
      // Check if browser is online
      if (!navigator.onLine) {
        console.log('Browser is offline, cannot connect to WebSocket');
        toast.error('You are offline. Real-time features will be unavailable until connection is restored.', {
          id: 'offline-toast',
          duration: 5000
        });
        return;
      }
      
      const wsUrl = process.env.REACT_APP_WEBSOCKET_URL || 'ws://localhost:3001';
      
      // Disconnect existing socket if any
      if (this.socket) {
        this.socket.disconnect();
      }
      
      // Create new socket connection with better options
      this.socket = io(wsUrl, {
        transports: ['websocket', 'polling'], // Fallback to polling if websocket fails
        reconnectionAttempts: 10,            // Let socket.io handle some reconnection
        reconnectionDelay: 1000,             // Start with 1s delay
        reconnectionDelayMax: 5000,          // Max 5s delay
        timeout: 20000,                      // Longer connection timeout
        query: {
          userId,
          userType
        }
      });

      this.socket.on('connect', () => {
        console.log('✅ WebSocket connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        
        // Clear any error toasts
        toast.dismiss('connection-toast');
        toast.dismiss('refresh-toast');
        
        // Join user-specific room
        this.socket.emit('join-room', { userId, userType });
      });

      this.socket.on('disconnect', (reason) => {
        console.log(`❌ WebSocket disconnected: ${reason}`);
        this.isConnected = false;
        
        // Only attempt our custom reconnect for certain disconnect reasons
        if (reason === 'io server disconnect' || reason === 'transport close') {
          this.attemptReconnect();
        }
        // For other reasons, socket.io will handle reconnection
      });

      this.socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        this.isConnected = false;
        this.attemptReconnect();
      });

      // Listen for real-time updates
      this.setupEventListeners();

    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      toast.error('Failed to connect to real-time service. Some features may be unavailable.');
    }
  }

  setupEventListeners() {
    if (!this.socket) return;

    // Initial salon data for room join
    this.socket.on('salon-data', (data) => {
      window.dispatchEvent(new CustomEvent('queueUpdate', { detail: { ...data, salonId: data.id } }));
    });

    // Queue updates
    this.socket.on('queue-updated', (data) => {
      console.log('Queue updated:', data);
      toast.success(`Queue updated at ${data.salonName}: ${data.currentQueue} people`);
      
      // Dispatch custom event for components to listen
      window.dispatchEvent(new CustomEvent('queueUpdate', { detail: data }));
    });
    
    // Booking status updates
    this.socket.on('booking-status-updated', (data) => {
      console.log('Booking status updated:', data);
      toast.success(`Booking status updated: ${data.status}`);
      
      // Dispatch custom event for components to listen
      window.dispatchEvent(new CustomEvent('bookingStatusUpdated', { detail: data }));
    });

    // Customer joined queue (confirmation to customer)
    this.socket.on('queue-joined', (data) => {
      window.dispatchEvent(new CustomEvent('queueJoined', { detail: data }));
    });

    // Position updated for a customer
    this.socket.on('position-updated', (data) => {
      window.dispatchEvent(new CustomEvent('positionUpdated', { detail: data }));
    });

    // Service completed for a customer
    this.socket.on('service-completed', (data) => {
      window.dispatchEvent(new CustomEvent('serviceCompleted', { detail: data }));
    });

    // Customer left queue
    this.socket.on('queue-left', (data) => {
      window.dispatchEvent(new CustomEvent('queueLeft', { detail: data }));
    });

    // Customer joined queue (broadcast to owner room)
    this.socket.on('customer-joined-queue', (data) => {
      window.dispatchEvent(new CustomEvent('customerJoinedQueue', { detail: data }));
    });

    // Booking notifications
    this.socket.on('booking-confirmed', (data) => {
      console.log('Booking confirmed:', data);
      toast.success(`Booking confirmed at ${data.salonName}!`);
      
      window.dispatchEvent(new CustomEvent('bookingConfirmed', { detail: data }));
    });

    // Turn notifications
    this.socket.on('your-turn', (data) => {
      console.log('Your turn:', data);
      toast.success(`It's your turn at ${data.salonName}! 🎉`);
      
      // Show browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification("It's Your Turn!", {
          body: `Please head to ${data.salonName} - your service is ready to begin`,
          icon: '/icons/turn-icon.png',
          requireInteraction: true
        });
      }
      
      window.dispatchEvent(new CustomEvent('yourTurn', { detail: data }));
    });

    // Payment notifications
    this.socket.on('payment-received', (data) => {
      console.log('Payment received:', data);
      toast.success(`Payment of $${data.amount} received!`);
      
      window.dispatchEvent(new CustomEvent('paymentReceived', { detail: data }));
    });

    // New booking (for salon owners)
    this.socket.on('new-booking', (data) => {
      console.log('New booking:', data);
      toast.success(`New booking from ${data.customerName}!`);
      
      window.dispatchEvent(new CustomEvent('newBooking', { detail: data }));
    });

    // General notifications
    this.socket.on('notification', (data) => {
      console.log('Notification received:', data);
      
      if (data.type === 'success') {
        toast.success(data.message);
      } else if (data.type === 'error') {
        toast.error(data.message);
      } else {
        toast(data.message);
      }
    });
  }

  attemptReconnect() {
    // Don't attempt to reconnect if browser is offline
    if (!navigator.onLine) {
      console.log('Browser is offline, delaying reconnection until online');
      return;
    }
    
    // Show different messages based on reconnection attempt count
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      // Still attempting to reconnect
      this.reconnectAttempts++;
      const delay = Math.min(30000, (Math.pow(2, this.reconnectAttempts) - 1) * 1000);
      
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms...`);
      
      // Don't show toast messages for reconnection attempts as requested
      // if (this.reconnectAttempts <= 3) {
      //   toast.loading(`Connection lost. Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`, {
      //     id: 'reconnecting-toast',
      //     duration: delay + 1000
      //   });
      // } else if (this.reconnectAttempts === 4) {
      //   // After a few attempts, show a persistent message with reconnect button
      //   toast.error('Connection issues detected. You can continue waiting or try manual reconnection.', {
      //     id: 'connection-issues',
      //     duration: 10000
      //   });
      // }
      
      setTimeout(() => {
        if (this.socket) {
          this.socket.connect();
        }
      }, delay);
    } else {
      // Max reconnection attempts reached
      console.log(`Maximum reconnection attempts (${this.maxReconnectAttempts}) reached.`);
      // Don't show the error toast here - let the ConnectionStatus component handle it
      // This prevents the persistent "Connection lost" message that can't be dismissed
    }
  }

  // Manual reconnect method that users can call
  reconnect() {
    console.log('Manual reconnection requested');
    if (this.userId) {
      // Reset reconnect attempts to give a fresh start
      this.reconnectAttempts = 0;
      toast.success('Attempting to reconnect...', { id: 'manual-reconnect' });
      this.connect(this.userId, this.userType);
      return true;
    } else {
      console.error('Cannot reconnect: No user ID stored');
      return false;
    }
  }
  
  // Helper method to check connection and show appropriate message
  checkConnectionBeforeEmit() {
    if (!this.isSocketConnected()) {
      if (!navigator.onLine) {
        toast.error('You are offline. This action will be queued until connection is restored.', {
          id: 'offline-action-toast',
          duration: 3000
        });
      } else {
        // Don't show connection lost toast as requested
        // toast.error('Connection to server lost. Attempting to reconnect...', {
        //   id: 'reconnect-action-toast',
        //   duration: 3000
        // });
        this.attemptReconnect();
      }
      return false;
    }
    return true;
  }

  // Emit events with connection checking
  updateQueue(salonId, change) {
    if (this.checkConnectionBeforeEmit()) {
      this.socket.emit('update-queue', { salonId, change });
      return true;
    }
    return false;
  }

  createBooking(bookingData) {
    if (this.checkConnectionBeforeEmit()) {
      this.socket.emit('create-booking', bookingData);
      return true;
    }
    return false;
  }

  completeService(customerId, salonId) {
    if (this.checkConnectionBeforeEmit()) {
      this.socket.emit('complete-service', { customerId, salonId });
      return true;
    }
    return false;
  }

  sendNotification(targetUserId, notification) {
    if (this.checkConnectionBeforeEmit()) {
      this.socket.emit('send-notification', { targetUserId, notification });
      return true;
    }
    return false;
  }

  // New methods for enhanced real-time features
  joinQueue(queueData) {
    if (this.checkConnectionBeforeEmit()) {
      this.socket.emit('join-queue', queueData);
      return true;
    }
    return false;
  }
  
  updateBookingStatus(bookingId, status, additionalData = {}) {
    if (this.checkConnectionBeforeEmit()) {
      this.socket.emit('update-booking-status', { bookingId, status, ...additionalData });
      return true;
    }
    return false;
  }

  leaveQueue(customerId, salonId) {
    if (this.checkConnectionBeforeEmit()) {
      this.socket.emit('leave-queue', { customerId, salonId });
      return true;
    }
    return false;
  }

  updateCustomerPosition(customerId, newPosition, salonId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('update-customer-position', { customerId, newPosition, salonId });
    }
  }

  updateStaffStatus(staffId, salonId, isAvailable) {
    if (this.socket && this.isConnected) {
      this.socket.emit('update-staff-status', { staffId, salonId, isAvailable });
    }
  }

  convertAppointmentToQueue(appointmentId, salonId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('appointment-to-queue', { appointmentId, salonId });
    }
  }

  paymentReceived(paymentData) {
    if (this.socket && this.isConnected) {
      this.socket.emit('payment-received', paymentData);
    }
  }

  // Join specific rooms
  joinSalonRoom(salonId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join-salon-room', { salonId });
    }
  }

  leaveSalonRoom(salonId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave-salon-room', { salonId });
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }
}

// Create singleton instance
const websocketService = new WebSocketService();

export default websocketService;
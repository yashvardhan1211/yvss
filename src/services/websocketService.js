import io from 'socket.io-client';
import toast from 'react-hot-toast';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  connect(userId, userType = 'customer') {
    try {
      const wsUrl = process.env.REACT_APP_WEBSOCKET_URL || 'ws://localhost:3001';
      
      this.socket = io(wsUrl, {
        transports: ['websocket'],
        query: {
          userId,
          userType
        }
      });

      this.socket.on('connect', () => {
        console.log('✅ WebSocket connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        
        // Join user-specific room
        this.socket.emit('join-room', { userId, userType });
      });

      this.socket.on('disconnect', () => {
        console.log('❌ WebSocket disconnected');
        this.isConnected = false;
        this.attemptReconnect();
      });

      this.socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        this.attemptReconnect();
      });

      // Listen for real-time updates
      this.setupEventListeners();

    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
    }
  }

  setupEventListeners() {
    if (!this.socket) return;

    // Queue updates
    this.socket.on('queue-updated', (data) => {
      console.log('Queue updated:', data);
      toast.success(`Queue updated at ${data.salonName}: ${data.currentQueue} people`);
      
      // Dispatch custom event for components to listen
      window.dispatchEvent(new CustomEvent('queueUpdate', { detail: data }));
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
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        if (this.socket) {
          this.socket.connect();
        }
      }, 2000 * this.reconnectAttempts); // Exponential backoff
    } else {
      console.error('Max reconnection attempts reached');
      toast.error('Connection lost. Please refresh the page.');
    }
  }

  // Emit events
  updateQueue(salonId, change) {
    if (this.socket && this.isConnected) {
      this.socket.emit('update-queue', { salonId, change });
    }
  }

  createBooking(bookingData) {
    if (this.socket && this.isConnected) {
      this.socket.emit('create-booking', bookingData);
    }
  }

  completeService(bookingId, salonId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('complete-service', { bookingId, salonId });
    }
  }

  sendNotification(targetUserId, notification) {
    if (this.socket && this.isConnected) {
      this.socket.emit('send-notification', { targetUserId, notification });
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
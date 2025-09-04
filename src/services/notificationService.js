import { requestNotificationPermission, onMessageListener } from '../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import toast from 'react-hot-toast';

// Initialize notifications
export const initializeNotifications = async (userId, userType = 'customer') => {
  try {
    const token = await requestNotificationPermission();
    
    if (token) {
      // Store FCM token in database
      await addDoc(collection(db, 'fcmTokens'), {
        userId,
        userType,
        token,
        createdAt: serverTimestamp(),
        isActive: true
      });
      
      console.log('Notifications initialized successfully');
      return token;
    }
  } catch (error) {
    console.error('Error initializing notifications:', error);
  }
  return null;
};

// Listen for foreground notifications
export const setupNotificationListener = () => {
  onMessageListener()
    .then((payload) => {
      console.log('Received foreground message:', payload);
      
      // Show toast notification
      toast.custom((t) => (
        <div className={`notification-toast ${t.visible ? 'animate-enter' : 'animate-leave'}`}>
          <div className="notification-icon">🔔</div>
          <div className="notification-content">
            <h4>{payload.notification?.title}</h4>
            <p>{payload.notification?.body}</p>
          </div>
          <button 
            onClick={() => toast.dismiss(t.id)}
            className="notification-close"
          >
            ×
          </button>
        </div>
      ), {
        duration: 5000,
        position: 'top-right'
      });
    })
    .catch((err) => console.log('Failed to receive message:', err));
};

// Send notification (would be called from backend)
export const sendNotification = async (notificationData) => {
  try {
    // In production, this would be a secure server endpoint
    const response = await fetch('/api/send-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(notificationData),
    });

    if (!response.ok) {
      throw new Error('Failed to send notification');
    }

    const result = await response.json();
    console.log('Notification sent successfully:', result);
    return result;
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
};

// Notification templates
export const notificationTemplates = {
  queueUpdate: (salonName, newQueueLength, estimatedWait) => ({
    title: `Queue Update - ${salonName}`,
    body: `Current queue: ${newQueueLength} people (${estimatedWait} min wait)`,
    icon: '/icons/queue-icon.png',
    badge: '/icons/badge-icon.png',
    data: {
      type: 'queue_update',
      salonName,
      queueLength: newQueueLength,
      estimatedWait
    }
  }),

  bookingConfirmed: (salonName, bookingTime) => ({
    title: 'Booking Confirmed! 🎉',
    body: `Your appointment at ${salonName} is confirmed for ${bookingTime}`,
    icon: '/icons/booking-icon.png',
    badge: '/icons/badge-icon.png',
    data: {
      type: 'booking_confirmed',
      salonName,
      bookingTime
    }
  }),

  yourTurn: (salonName) => ({
    title: "It's Your Turn!",
    body: `Please head to ${salonName} - your service is ready to begin`,
    icon: '/icons/turn-icon.png',
    badge: '/icons/badge-icon.png',
    data: {
      type: 'your_turn',
      salonName
    }
  }),

  serviceComplete: (salonName, totalAmount) => ({
    title: 'Service Complete! ✨',
    body: `Thank you for visiting ${salonName}. Total: $${totalAmount}`,
    icon: '/icons/complete-icon.png',
    badge: '/icons/badge-icon.png',
    data: {
      type: 'service_complete',
      salonName,
      totalAmount
    }
  }),

  paymentReceived: (amount, salonName) => ({
    title: 'Payment Received',
    body: `Received $${amount} payment from customer at ${salonName}`,
    icon: '/icons/payment-icon.png',
    badge: '/icons/badge-icon.png',
    data: {
      type: 'payment_received',
      amount,
      salonName
    }
  }),

  newBooking: (customerName, service, time) => ({
    title: 'New Booking! 📅',
    body: `${customerName} booked ${service} for ${time}`,
    icon: '/icons/new-booking-icon.png',
    badge: '/icons/badge-icon.png',
    data: {
      type: 'new_booking',
      customerName,
      service,
      time
    }
  })
};

// Queue position notifications
export const notifyQueuePosition = async (userId, salonName, position, estimatedWait) => {
  const notifications = {
    5: `You're 5th in line at ${salonName}! Estimated wait: ${estimatedWait} minutes`,
    3: `Almost there! You're 3rd in line at ${salonName}`,
    1: `You're next! Please head to ${salonName} now`,
    0: `It's your turn at ${salonName}! 🎉`
  };

  if (notifications[position]) {
    await sendNotification({
      userId,
      title: position === 0 ? "It's Your Turn!" : `Queue Update - ${salonName}`,
      body: notifications[position],
      data: {
        type: 'queue_position',
        position,
        salonName,
        estimatedWait
      }
    });
  }
};

// Browser notification (fallback)
export const showBrowserNotification = (title, body, icon = '/icons/default-icon.png') => {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon,
      badge: '/icons/badge-icon.png',
      tag: 'salon-notification',
      requireInteraction: true
    });
  }
};
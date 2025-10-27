import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { db } from '../firebase/config';
import websocketService from './websocketService';
import toast from 'react-hot-toast';

// Salon Management
export const createSalon = async (salonData) => {
  try {
    const docRef = await addDoc(collection(db, 'salons'), {
      ...salonData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isActive: true,
      currentQueue: 0,
      estimatedWaitTime: 0,
      totalCustomersToday: 0,
      revenueToday: 0
    });

    toast.success('Salon registered successfully!');
    return docRef.id;
  } catch (error) {
    console.error('Error creating salon:', error);
    toast.error('Failed to register salon');
    throw error;
  }
};

export const updateSalon = async (salonId, updates) => {
  try {
    const salonRef = doc(db, 'salons', salonId);
    await updateDoc(salonRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });

    toast.success('Salon updated successfully!');
  } catch (error) {
    console.error('Error updating salon:', error);
    toast.error('Failed to update salon');
    throw error;
  }
};

export const getSalon = async (salonId) => {
  try {
    const salonRef = doc(db, 'salons', salonId);
    const salonSnap = await getDoc(salonRef);

    if (salonSnap.exists()) {
      return { id: salonSnap.id, ...salonSnap.data() };
    } else {
      throw new Error('Salon not found');
    }
  } catch (error) {
    console.error('Error getting salon:', error);
    throw error;
  }
};

export const getNearbyRealTimeSalons = (location, radius = 10) => {
  // For demo, we'll use a simple query. In production, you'd use GeoFirestore
  const salonsRef = collection(db, 'salons');
  const q = query(
    salonsRef,
    where('isActive', '==', true),
    orderBy('updatedAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const salons = [];
    snapshot.forEach((doc) => {
      const salonData = { id: doc.id, ...doc.data() };

      // Simple distance calculation (in production, use proper geospatial queries)
      if (salonData.location) {
        const distance = calculateDistance(
          location.lat,
          location.lng,
          salonData.location.lat,
          salonData.location.lng
        );

        if (distance <= radius) {
          salons.push({ ...salonData, distance });
        }
      }
    });

    return salons.sort((a, b) => a.distance - b.distance);
  });
};

// Queue Management
export const updateQueue = async (salonId, queueChange) => {
  try {
    const salonRef = doc(db, 'salons', salonId);
    await updateDoc(salonRef, {
      currentQueue: increment(queueChange),
      estimatedWaitTime: increment(queueChange * 5), // 5 min per customer
      updatedAt: serverTimestamp()
    });

    // Create queue update log
    await addDoc(collection(db, 'queueUpdates'), {
      salonId,
      change: queueChange,
      timestamp: serverTimestamp(),
      type: queueChange > 0 ? 'customer_added' : 'customer_completed'
    });

    // Send real-time update via WebSocket
    if (websocketService.isConnected) {
      websocketService.updateQueue(salonId, queueChange);
    }

    toast.success(`Queue ${queueChange > 0 ? 'increased' : 'decreased'} successfully!`);
  } catch (error) {
    console.error('Error updating queue:', error);
    toast.error('Failed to update queue');
    throw error;
  }
};

// Booking Management
export const createBooking = async (bookingData) => {
  try {
    const docRef = await addDoc(collection(db, 'bookings'), {
      ...bookingData,
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // Send real-time booking notification via WebSocket
    if (websocketService.isConnected) {
      websocketService.createBooking({
        ...bookingData,
        bookingId: docRef.id,
        status: 'confirmed'
      });
    }

    toast.success('Booking created successfully!');
    return docRef.id;
  } catch (error) {
    console.error('Error creating booking:', error);
    toast.error('Failed to create booking');
    throw error;
  }
};

export const updateBookingStatus = async (bookingId, status) => {
  try {
    const bookingRef = doc(db, 'bookings', bookingId);
    await updateDoc(bookingRef, {
      status,
      updatedAt: serverTimestamp()
    });

    if (status === 'completed') {
      // Get booking data to update salon stats
      const bookingSnap = await getDoc(bookingRef);
      if (bookingSnap.exists()) {
        const booking = bookingSnap.data();

        // Update salon stats
        const salonRef = doc(db, 'salons', booking.salonId);
        await updateDoc(salonRef, {
          totalCustomersToday: increment(1),
          revenueToday: increment(booking.totalAmount || 0),
          currentQueue: increment(-1),
          updatedAt: serverTimestamp()
        });
      }
    }

    toast.success(`Booking ${status} successfully!`);
  } catch (error) {
    console.error('Error updating booking status:', error);
    toast.error('Failed to update booking');
    throw error;
  }
};

export const getSalonBookings = (salonId) => {
  const bookingsRef = collection(db, 'bookings');
  const q = query(
    bookingsRef,
    where('salonId', '==', salonId),
    where('status', 'in', ['pending', 'confirmed', 'in_progress']),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(q, (snapshot) => {
    const bookings = [];
    snapshot.forEach((doc) => {
      bookings.push({ id: doc.id, ...doc.data() });
    });
    return bookings;
  });
};

// Real-time listeners
export const listenToSalonUpdates = (salonId, callback) => {
  const salonRef = doc(db, 'salons', salonId);
  return onSnapshot(salonRef, (doc) => {
    if (doc.exists()) {
      callback({ id: doc.id, ...doc.data() });
    }
  });
};

export const listenToQueueUpdates = (salonId, callback) => {
  const queueRef = collection(db, 'queueUpdates');
  const q = query(
    queueRef,
    where('salonId', '==', salonId),
    orderBy('timestamp', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const updates = [];
    snapshot.forEach((doc) => {
      updates.push({ id: doc.id, ...doc.data() });
    });
    callback(updates);
  });
};

// Utility functions
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Real-time Queue Management
export const joinQueueRealTime = async (salonId, customerData) => {
  try {
    // Create queue entry in Firebase
    const queueRef = await addDoc(collection(db, 'queueEntries'), {
      salonId,
      customerName: customerData.customerName,
      customerPhone: customerData.customerPhone,
      services: customerData.selectedServices,
      totalAmount: customerData.totalAmount,
      totalDuration: customerData.totalDuration,
      status: 'waiting',
      joinedAt: serverTimestamp(),
      position: 0 // Will be calculated by server
    });

    // Send real-time update via WebSocket
    if (websocketService.isConnected) {
      websocketService.joinQueue({
        ...customerData,
        salonId,
        queueId: queueRef.id
      });
    }

    return queueRef.id;
  } catch (error) {
    console.error('Error joining queue:', error);
    throw error;
  }
};

export const leaveQueueRealTime = async (queueId, salonId, customerId) => {
  try {
    // Update queue entry status in Firebase
    const queueRef = doc(db, 'queueEntries', queueId);
    await updateDoc(queueRef, {
      status: 'left',
      leftAt: serverTimestamp()
    });

    // Send real-time update via WebSocket
    if (websocketService.isConnected) {
      websocketService.leaveQueue(customerId, salonId);
    }

    return true;
  } catch (error) {
    console.error('Error leaving queue:', error);
    throw error;
  }
};

export const completeServiceRealTime = async (queueId, salonId, customerId) => {
  try {
    // Update queue entry status in Firebase
    const queueRef = doc(db, 'queueEntries', queueId);
    await updateDoc(queueRef, {
      status: 'completed',
      completedAt: serverTimestamp()
    });

    // Update salon stats
    const salonRef = doc(db, 'salons', salonId);
    await updateDoc(salonRef, {
      totalCustomersToday: increment(1),
      currentQueue: increment(-1),
      updatedAt: serverTimestamp()
    });

    // Send real-time update via WebSocket
    if (websocketService.isConnected) {
      websocketService.completeService(customerId, salonId);
    }

    return true;
  } catch (error) {
    console.error('Error completing service:', error);
    throw error;
  }
};

// Analytics and Reporting
export const getSalonAnalytics = async (salonId, dateRange = 'today') => {
  try {
    const salon = await getSalon(salonId);

    // Get queue entries for analytics
    const queueRef = collection(db, 'queueEntries');
    const q = query(
      queueRef,
      where('salonId', '==', salonId),
      where('status', 'in', ['completed', 'left']),
      orderBy('joinedAt', 'desc')
    );

    const snapshot = await getDocs(q);
    const entries = [];
    snapshot.forEach((doc) => {
      entries.push({ id: doc.id, ...doc.data() });
    });

    // Calculate analytics
    const analytics = {
      totalCustomers: entries.filter(e => e.status === 'completed').length,
      totalRevenue: entries
        .filter(e => e.status === 'completed')
        .reduce((sum, e) => sum + (e.totalAmount || 0), 0),
      averageWaitTime: calculateAverageWaitTime(entries),
      peakHours: calculatePeakHours(entries),
      customerSatisfaction: calculateSatisfactionRate(entries),
      noShowRate: entries.filter(e => e.status === 'left').length / entries.length * 100
    };

    return {
      salon,
      analytics,
      entries: entries.slice(0, 50) // Latest 50 entries
    };
  } catch (error) {
    console.error('Error getting salon analytics:', error);
    throw error;
  }
};

// Staff Management
export const updateStaffStatus = async (salonId, staffId, isAvailable) => {
  try {
    // Update staff status in Firebase
    const staffRef = doc(db, 'staff', staffId);
    await updateDoc(staffRef, {
      isAvailable,
      lastUpdated: serverTimestamp()
    });

    // Send real-time update via WebSocket
    if (websocketService.isConnected) {
      websocketService.updateStaffStatus(staffId, salonId, isAvailable);
    }

    return true;
  } catch (error) {
    console.error('Error updating staff status:', error);
    throw error;
  }
};

// Notification Management
export const sendCustomerNotification = async (customerId, message, type = 'info') => {
  try {
    // Store notification in Firebase
    await addDoc(collection(db, 'notifications'), {
      customerId,
      message,
      type,
      sentAt: serverTimestamp(),
      read: false
    });

    // Send real-time notification via WebSocket
    if (websocketService.isConnected) {
      websocketService.sendNotification(`customer_${customerId}`, {
        type,
        message
      });
    }

    return true;
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
};

// Utility functions for analytics
const calculateAverageWaitTime = (entries) => {
  const completedEntries = entries.filter(e => e.status === 'completed' && e.joinedAt && e.completedAt);
  if (completedEntries.length === 0) return 0;

  const totalWaitTime = completedEntries.reduce((sum, entry) => {
    const waitTime = entry.completedAt.toDate() - entry.joinedAt.toDate();
    return sum + waitTime;
  }, 0);

  return Math.round(totalWaitTime / completedEntries.length / (1000 * 60)); // Convert to minutes
};

const calculatePeakHours = (entries) => {
  const hourCounts = {};

  entries.forEach(entry => {
    if (entry.joinedAt) {
      const hour = entry.joinedAt.toDate().getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    }
  });

  const sortedHours = Object.entries(hourCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  return sortedHours.map(([hour, count]) => ({
    hour: `${hour}:00`,
    customers: count
  }));
};

const calculateSatisfactionRate = (entries) => {
  const completedEntries = entries.filter(e => e.status === 'completed');
  if (completedEntries.length === 0) return 0;

  // Assume customers who completed service are satisfied
  // In a real app, you'd have actual satisfaction ratings
  return Math.round((completedEntries.length / entries.length) * 100);
};

// Export WebSocket service for direct access
export { websocketService };

// Test Owner Data for Development
export const TEST_OWNER_DATA = {
  id: 'owner_iitp_hair_salon',
  email: 'owner@iitp-salon.com',
  password: 'test123',
  name: 'Rajesh Kumar',
  phone: '+91 9876543210',
  salon: {
    id: 'salon_iitp_hair',
    name: 'Elite Hair Studio IITP',
    address: 'Near Main Gate, IIT Patna, Bihta, Patna - 801106',
    phone: '+91 9876543210',
    email: 'contact@iitp-salon.com',
    description: 'Premium hair salon serving IIT Patna community with modern styling and grooming services.',
    services: [
      {
        id: 'haircut_men',
        name: 'Men\'s Haircut',
        description: 'Professional haircut with styling',
        price: 300,
        duration: 30,
        category: 'Haircut'
      },
      {
        id: 'haircut_women',
        name: 'Women\'s Haircut',
        description: 'Stylish cut with blow dry',
        price: 500,
        duration: 45,
        category: 'Haircut'
      },
      {
        id: 'beard_trim',
        name: 'Beard Trim & Styling',
        description: 'Professional beard grooming',
        price: 150,
        duration: 20,
        category: 'Grooming'
      },
      {
        id: 'hair_wash',
        name: 'Hair Wash & Conditioning',
        description: 'Deep cleansing with premium products',
        price: 200,
        duration: 25,
        category: 'Treatment'
      },
      {
        id: 'hair_color',
        name: 'Hair Coloring',
        description: 'Professional hair coloring service',
        price: 1200,
        duration: 90,
        category: 'Coloring'
      },
      {
        id: 'facial_men',
        name: 'Men\'s Facial',
        description: 'Refreshing facial treatment',
        price: 400,
        duration: 40,
        category: 'Facial'
      }
    ],
    hours: {
      monday: { open: '09:00', close: '20:00', closed: false },
      tuesday: { open: '09:00', close: '20:00', closed: false },
      wednesday: { open: '09:00', close: '20:00', closed: false },
      thursday: { open: '09:00', close: '20:00', closed: false },
      friday: { open: '09:00', close: '20:00', closed: false },
      saturday: { open: '09:00', close: '21:00', closed: false },
      sunday: { open: '10:00', close: '19:00', closed: false }
    },
    location: {
      lat: 25.5941,
      lng: 85.1376,
      city: 'Patna',
      state: 'Bihar',
      country: 'India'
    },
    amenities: ['AC', 'WiFi', 'Parking', 'Card Payment'],
    rating: 4.5,
    reviewCount: 127,
    isOpen: true,
    currentQueue: 3,
    estimatedWaitTime: 25,
    totalCustomersToday: 12,
    revenueToday: 3600
  }
};

// Test login function for development
export const testOwnerLogin = async (email, password) => {
  if (email === TEST_OWNER_DATA.email && password === TEST_OWNER_DATA.password) {
    // Simulate successful login
    return {
      success: true,
      owner: TEST_OWNER_DATA,
      token: 'test_token_' + Date.now()
    };
  }
  
  throw new Error('Invalid credentials');
};

// Get test salon data
export const getTestSalonData = () => {
  return TEST_OWNER_DATA.salon;
};

// Mock queue data for testing
export const getMockQueueData = () => {
  return [
    {
      id: 'queue_1',
      customerName: 'Amit Singh',
      customerPhone: '+91 9876543211',
      services: ['Men\'s Haircut', 'Beard Trim'],
      totalAmount: 450,
      totalDuration: 50,
      status: 'waiting',
      position: 1,
      joinedAt: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
      estimatedTime: '10 mins'
    },
    {
      id: 'queue_2',
      customerName: 'Priya Sharma',
      customerPhone: '+91 9876543212',
      services: ['Women\'s Haircut'],
      totalAmount: 500,
      totalDuration: 45,
      status: 'in_progress',
      position: 0,
      joinedAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      estimatedTime: 'In Progress'
    },
    {
      id: 'queue_3',
      customerName: 'Rohit Kumar',
      customerPhone: '+91 9876543213',
      services: ['Hair Wash', 'Men\'s Facial'],
      totalAmount: 600,
      totalDuration: 65,
      status: 'waiting',
      position: 2,
      joinedAt: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      estimatedTime: '25 mins'
    }
  ];
};
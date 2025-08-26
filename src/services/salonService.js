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
    
    // Update salon queue
    await updateQueue(bookingData.salonId, 1);
    
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
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};
import { useState, useEffect, useCallback } from 'react';
import websocketService from '../services/websocketService';
import toast from 'react-hot-toast';

/**
 * Custom hook for real-time queue management
 * Handles both customer and owner perspectives
 */
export const useRealTimeQueue = (salonId, userType = 'customer', userId = null) => {
  const [queueData, setQueueData] = useState({
    currentQueue: 0,
    estimatedWaitTime: 0,
    customers: [],
    isOpen: true
  });

  const [customerStatus, setCustomerStatus] = useState({
    isInQueue: false,
    position: null,
    estimatedWaitTime: null,
    customerId: null
  });

  const [isConnected, setIsConnected] = useState(false);

  // Initialize WebSocket connection
  useEffect(() => {
    if (salonId && userId) {
      websocketService.connect(userId, userType);
      websocketService.joinSalonRoom(salonId);
      setIsConnected(true);

      return () => {
        websocketService.leaveSalonRoom(salonId);
        setIsConnected(false);
      };
    }
  }, [salonId, userId, userType]);

  // Queue update handler
  const handleQueueUpdate = useCallback((event) => {
    const data = event.detail;
    if (data.salonId === salonId) {
      setQueueData(prev => ({
        ...prev,
        currentQueue: data.currentQueue,
        estimatedWaitTime: data.estimatedWaitTime,
        customers: data.customers || prev.customers
      }));
    }
  }, [salonId]);

  // Customer queue joined handler
  const handleQueueJoined = useCallback((event) => {
    const data = event.detail;
    setCustomerStatus({
      isInQueue: true,
      position: data.position,
      estimatedWaitTime: data.estimatedWaitTime,
      customerId: data.customerId
    });
    
    // Store in localStorage for persistence
    localStorage.setItem('queueStatus', JSON.stringify({
      salonId,
      customerId: data.customerId,
      position: data.position,
      estimatedWaitTime: data.estimatedWaitTime,
      joinedAt: new Date().toISOString()
    }));
  }, [salonId]);

  // Position update handler
  const handlePositionUpdate = useCallback((event) => {
    const data = event.detail;
    setCustomerStatus(prev => ({
      ...prev,
      position: data.position,
      estimatedWaitTime: data.estimatedWaitTime
    }));
    
    // Update localStorage
    const stored = JSON.parse(localStorage.getItem('queueStatus') || '{}');
    if (stored.salonId === salonId) {
      localStorage.setItem('queueStatus', JSON.stringify({
        ...stored,
        position: data.position,
        estimatedWaitTime: data.estimatedWaitTime
      }));
    }

    // Update booking position in userBookings
    const userBookings = JSON.parse(localStorage.getItem('userBookings') || '[]');
    const updatedBookings = userBookings.map(booking => {
      if (booking.type === 'queue' && booking.salonId === salonId && booking.status === 'in_queue') {
        return {
          ...booking,
          queuePosition: data.position,
          estimatedWaitTime: data.estimatedWaitTime,
          updatedAt: new Date().toISOString()
        };
      }
      return booking;
    });
    localStorage.setItem('userBookings', JSON.stringify(updatedBookings));
  }, [salonId]);

  // Your turn handler
  const handleYourTurn = useCallback((event) => {
    const data = event.detail;
    setCustomerStatus(prev => ({
      ...prev,
      position: 1,
      estimatedWaitTime: 0
    }));
    
    // Vibrate if supported
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }
  }, []);

  // Service completed handler
  const handleServiceCompleted = useCallback((event) => {
    setCustomerStatus({
      isInQueue: false,
      position: null,
      estimatedWaitTime: null,
      customerId: null
    });
    
    // Clear localStorage
    localStorage.removeItem('queueStatus');
  }, []);

  // Queue left handler
  const handleQueueLeft = useCallback((event) => {
    setCustomerStatus({
      isInQueue: false,
      position: null,
      estimatedWaitTime: null,
      customerId: null
    });
    
    // Clear localStorage
    localStorage.removeItem('queueStatus');
  }, []);

  // Customer joined queue (for owners)
  const handleCustomerJoinedQueue = useCallback((event) => {
    const data = event.detail;
    setQueueData(prev => ({
      ...prev,
      currentQueue: data.queueLength,
      estimatedWaitTime: data.estimatedWaitTime,
      customers: [...(prev.customers || []), data.customer]
    }));
  }, []);

  // Set up event listeners
  useEffect(() => {
    window.addEventListener('queueUpdate', handleQueueUpdate);
    window.addEventListener('queueJoined', handleQueueJoined);
    window.addEventListener('positionUpdated', handlePositionUpdate);
    window.addEventListener('yourTurn', handleYourTurn);
    window.addEventListener('serviceCompleted', handleServiceCompleted);
    window.addEventListener('queueLeft', handleQueueLeft);
    window.addEventListener('customerJoinedQueue', handleCustomerJoinedQueue);

    return () => {
      window.removeEventListener('queueUpdate', handleQueueUpdate);
      window.removeEventListener('queueJoined', handleQueueJoined);
      window.removeEventListener('positionUpdated', handlePositionUpdate);
      window.removeEventListener('yourTurn', handleYourTurn);
      window.removeEventListener('serviceCompleted', handleServiceCompleted);
      window.removeEventListener('queueLeft', handleQueueLeft);
      window.removeEventListener('customerJoinedQueue', handleCustomerJoinedQueue);
    };
  }, [
    handleQueueUpdate,
    handleQueueJoined,
    handlePositionUpdate,
    handleYourTurn,
    handleServiceCompleted,
    handleQueueLeft,
    handleCustomerJoinedQueue
  ]);

  // Check for existing queue status on mount
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('queueStatus') || '{}');
    if (stored.salonId === salonId && stored.customerId) {
      setCustomerStatus({
        isInQueue: true,
        position: stored.position,
        estimatedWaitTime: stored.estimatedWaitTime,
        customerId: stored.customerId
      });
    }
  }, [salonId]);

  // Actions
  const joinQueue = useCallback(async (customerData) => {
    if (!isConnected) {
      toast.error('Not connected to real-time updates');
      return false;
    }

    try {
      const customerId = `customer_${Date.now()}`;
      const queueData = {
        ...customerData,
        salonId,
        customerId
      };

      websocketService.joinQueue(queueData);
      return true;
    } catch (error) {
      console.error('Failed to join queue:', error);
      toast.error('Failed to join queue');
      return false;
    }
  }, [salonId, isConnected]);

  const leaveQueue = useCallback(async () => {
    if (!isConnected || !customerStatus.customerId) {
      return false;
    }

    try {
      websocketService.leaveQueue(customerStatus.customerId, salonId);
      return true;
    } catch (error) {
      console.error('Failed to leave queue:', error);
      toast.error('Failed to leave queue');
      return false;
    }
  }, [salonId, customerStatus.customerId, isConnected]);

  const completeService = useCallback(async (customerId) => {
    if (!isConnected) {
      return false;
    }

    try {
      websocketService.completeService(customerId, salonId);
      return true;
    } catch (error) {
      console.error('Failed to complete service:', error);
      toast.error('Failed to complete service');
      return false;
    }
  }, [salonId, isConnected]);

  const updateStaffStatus = useCallback(async (staffId, isAvailable) => {
    if (!isConnected) {
      return false;
    }

    try {
      websocketService.updateStaffStatus(staffId, salonId, isAvailable);
      return true;
    } catch (error) {
      console.error('Failed to update staff status:', error);
      toast.error('Failed to update staff status');
      return false;
    }
  }, [salonId, isConnected]);

  const convertAppointmentToQueue = useCallback(async (appointmentId) => {
    if (!isConnected) {
      return false;
    }

    try {
      websocketService.convertAppointmentToQueue(appointmentId, salonId);
      return true;
    } catch (error) {
      console.error('Failed to convert appointment:', error);
      toast.error('Failed to convert appointment');
      return false;
    }
  }, [salonId, isConnected]);

  return {
    // State
    queueData,
    customerStatus,
    isConnected,
    
    // Actions
    joinQueue,
    leaveQueue,
    completeService,
    updateStaffStatus,
    convertAppointmentToQueue,
    
    // Utilities
    isCustomerInQueue: customerStatus.isInQueue,
    customerPosition: customerStatus.position,
    estimatedWaitTime: customerStatus.estimatedWaitTime
  };
};

export default useRealTimeQueue;
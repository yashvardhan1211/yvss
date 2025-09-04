import React, { useState, useEffect } from 'react';
import websocketService from '../services/websocketService';
import toast from 'react-hot-toast';
import './ConnectionStatus.css';

const ConnectionStatus = () => {
  const [isConnected, setIsConnected] = useState(websocketService.isSocketConnected());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check connection status initially and set up listeners
    const checkConnection = () => {
      const connected = websocketService.isSocketConnected();
      setIsConnected(connected);
      setShowBanner(!connected && isOnline);
    };

    // Set up event listeners for connection status changes
    const handleConnect = () => {
      setIsConnected(true);
      setShowBanner(false);
      toast.success('Connection restored!', { id: 'connection-restored' });
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      if (isOnline) {
        setShowBanner(true);
      }
    };

    const handleOnline = () => {
      setIsOnline(true);
      // When coming back online, check if we're connected to the socket
      if (!websocketService.isSocketConnected()) {
        setShowBanner(true);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
    };

    // Initial check
    checkConnection();

    // Set up socket event listeners
    if (websocketService.socket) {
      websocketService.socket.on('connect', handleConnect);
      websocketService.socket.on('disconnect', handleDisconnect);
    }

    // Set up browser online/offline listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check connection status periodically
    const intervalId = setInterval(checkConnection, 5000);

    return () => {
      // Clean up event listeners
      if (websocketService.socket) {
        websocketService.socket.off('connect', handleConnect);
        websocketService.socket.off('disconnect', handleDisconnect);
      }
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
    };
  }, [isOnline]);

  const handleReconnect = () => {
    if (!isConnected && isOnline) {
      toast.loading('Attempting to reconnect...', { id: 'reconnecting' });
      const success = websocketService.reconnect();
      if (!success) {
        toast.error('Unable to reconnect. Please refresh the page.', { id: 'reconnecting' });
      }
    }
  };

  // Hide connection banner for better UX
  return null;
};

export default ConnectionStatus;
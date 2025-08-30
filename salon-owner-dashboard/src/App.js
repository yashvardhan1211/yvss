import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import './App.css';

const SALON_ID = 'salon_1'; // TODO: make dynamic via auth/selection

function App() {
  const socketRef = useRef(null);
  const [queue, setQueue] = useState({ currentQueue: 0, estimatedWaitTime: 0, customers: [] });

  useEffect(() => {
    const url = process.env.REACT_APP_WEBSOCKET_URL || 'ws://localhost:3001';
    socketRef.current = io(url, {
      transports: ['websocket'],
      query: { userId: 'owner_1', userType: 'owner' }
    });

    socketRef.current.on('connect', () => {
      socketRef.current.emit('join-salon-room', { salonId: SALON_ID });
    });

    socketRef.current.on('salon-data', (data) => setQueue({
      currentQueue: data.currentQueue,
      estimatedWaitTime: data.estimatedWaitTime,
      customers: data.customers || []
    }));

    socketRef.current.on('queue-updated', (data) => {
      if (data.salonId === SALON_ID) {
        setQueue((prev) => ({
          ...prev,
          currentQueue: data.currentQueue,
          estimatedWaitTime: data.estimatedWaitTime,
          customers: data.customers ?? prev.customers
        }));
      }
    });

    socketRef.current.on('customer-joined-queue', ({ queueLength, estimatedWaitTime, customer }) => {
      setQueue((prev) => ({
        currentQueue: queueLength,
        estimatedWaitTime,
        customers: [...(prev.customers || []), customer]
      }));
    });

    return () => socketRef.current?.disconnect();
  }, []);

  const add = () => socketRef.current?.emit('update-queue', { salonId: SALON_ID, change: 1 });
  const remove = () => socketRef.current?.emit('update-queue', { salonId: SALON_ID, change: -1 });
  const complete = (customerId) => socketRef.current?.emit('complete-service', { customerId, salonId: SALON_ID });

  return (
    <div className="App">
      <h2>Owner Dashboard</h2>
      <p>Queue: {queue.currentQueue} | ETA: {queue.estimatedWaitTime} min</p>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button onClick={add}>+ Queue</button>
        <button onClick={remove}>- Queue</button>
      </div>
      <ul>
        {(queue.customers || []).map(c => (
          <li key={c.customerId}>
            {c.customerName} (pos {c.position}) <button onClick={() => complete(c.customerId)}>Complete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
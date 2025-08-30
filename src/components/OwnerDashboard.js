import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useRealTimeQueue } from '../hooks/useRealTimeQueue';
import websocketService from '../services/websocketService';
import toast from 'react-hot-toast';
import './OwnerDashboard.css';

const OwnerDashboard = ({ ownerData, onLogout }) => {
  const [socket, setSocket] = useState(null);
  const [queueData, setQueueData] = useState({
    currentQueue: 5,
    estimatedWaitTime: 25,
    isOpen: true,
    services: [
      { id: 1, name: 'Haircut', duration: 30, price: 500, category: 'Hair' },
      { id: 2, name: 'Hair Styling', duration: 45, price: 700, category: 'Hair' },
      { id: 3, name: 'Facial Treatment', duration: 60, price: 800, category: 'Skincare' },
      { id: 4, name: 'Beard Trim', duration: 15, price: 300, category: 'Hair' },
      { id: 5, name: 'Manicure', duration: 45, price: 400, category: 'Nails' },
      { id: 6, name: 'Pedicure', duration: 60, price: 600, category: 'Nails' }
    ]
  });

  const [todayStats, setTodayStats] = useState({
    totalCustomers: 23,
    revenue: 4200,
    avgWaitTime: 18,
    customersSatisfied: 21,
    totalBookings: 28,
    cancelledBookings: 2
  });

  const [recentCustomers, setRecentCustomers] = useState([
    { 
      id: 1, 
      name: 'Priya Sharma', 
      service: 'Haircut + Styling', 
      time: '2:30 PM', 
      status: 'In Progress',
      phone: '+91 98765 43210',
      amount: 1200,
      duration: 75,
      isPrepaid: true,
      workStatus: 'ongoing',
      operatorId: 1
    },
    { 
      id: 2, 
      name: 'Rahul Gupta', 
      service: 'Beard Trim', 
      time: '2:45 PM', 
      status: 'Waiting',
      phone: '+91 87654 32109',
      amount: 300,
      duration: 15,
      isPrepaid: false,
      workStatus: 'waiting',
      operatorId: null
    },
    { 
      id: 3, 
      name: 'Anita Patel', 
      service: 'Facial Treatment', 
      time: '3:00 PM', 
      status: 'Waiting',
      phone: '+91 76543 21098',
      amount: 800,
      duration: 60,
      isPrepaid: true,
      workStatus: 'waiting',
      operatorId: null
    },
    { 
      id: 4, 
      name: 'Vikram Singh', 
      service: 'Haircut', 
      time: '3:15 PM', 
      status: 'Waiting',
      phone: '+91 65432 10987',
      amount: 500,
      duration: 30,
      isPrepaid: false,
      workStatus: 'waiting',
      operatorId: null
    },
    { 
      id: 5, 
      name: 'Meera Joshi', 
      service: 'Manicure + Pedicure', 
      time: '3:30 PM', 
      status: 'Waiting',
      phone: '+91 54321 09876',
      amount: 1000,
      duration: 105,
      isPrepaid: true,
      workStatus: 'waiting',
      operatorId: null
    }
  ]);

  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Appointments state
  const [appointments, setAppointments] = useState([
    {
      id: 1,
      customerName: 'Priya Sharma',
      customerPhone: '+91 98765 43210',
      service: 'Haircut + Styling',
      date: new Date().toISOString().split('T')[0],
      time: '14:30',
      duration: 75,
      amount: 1200,
      status: 'confirmed',
      operatorId: 1,
      notes: 'Regular customer, prefers layer cut'
    },
    {
      id: 2,
      customerName: 'Rahul Gupta',
      customerPhone: '+91 87654 32109',
      service: 'Beard Trim',
      date: new Date().toISOString().split('T')[0],
      time: '15:00',
      duration: 15,
      amount: 300,
      status: 'confirmed',
      operatorId: 2,
      notes: ''
    }
  ]);

  // Customer history and loyalty
  const [customerHistory, setCustomerHistory] = useState({
    'Priya Sharma': {
      totalVisits: 12,
      totalSpent: 14400,
      lastVisit: '2024-01-15',
      loyaltyPoints: 144,
      preferredServices: ['Haircut + Styling', 'Facial Treatment'],
      notes: 'VIP customer, always books in advance'
    },
    'Rahul Gupta': {
      totalVisits: 8,
      totalSpent: 2400,
      lastVisit: '2024-01-10',
      loyaltyPoints: 24,
      preferredServices: ['Beard Trim', 'Haircut'],
      notes: 'Prefers quick services'
    }
  });

  // Inventory management
  const [inventory, setInventory] = useState([
    { id: 1, name: 'Hair Shampoo', category: 'Hair Care', stock: 15, minStock: 5, price: 450, supplier: 'Beauty Co.' },
    { id: 2, name: 'Hair Conditioner', category: 'Hair Care', stock: 12, minStock: 5, price: 520, supplier: 'Beauty Co.' },
    { id: 3, name: 'Face Cleanser', category: 'Skincare', stock: 8, minStock: 3, price: 680, supplier: 'Skin Plus' },
    { id: 4, name: 'Nail Polish', category: 'Nails', stock: 25, minStock: 10, price: 280, supplier: 'Color World' },
    { id: 5, name: 'Hair Oil', category: 'Hair Care', stock: 3, minStock: 5, price: 350, supplier: 'Natural Care' }
  ]);
  
  // Staff/Operator management
  const [staff, setStaff] = useState([
    { 
      id: 1, 
      name: 'Ravi Kumar', 
      role: 'Senior Stylist',
      isAvailable: false, 
      phone: '+91 98765 11111',
      email: 'ravi@salon.com',
      specialties: ['Haircut', 'Hair Styling', 'Beard Trim'],
      experience: '5 years',
      rating: 4.8,
      todayBookings: 6,
      todayRevenue: 3600,
      shift: '09:00-18:00',
      commission: 30
    },
    { 
      id: 2, 
      name: 'Priya Patel', 
      role: 'Beauty Specialist',
      isAvailable: true, 
      phone: '+91 98765 22222',
      email: 'priya@salon.com',
      specialties: ['Facial Treatment', 'Skincare', 'Makeup'],
      experience: '3 years',
      rating: 4.9,
      todayBookings: 4,
      todayRevenue: 3200,
      shift: '10:00-19:00',
      commission: 25
    },
    { 
      id: 3, 
      name: 'Amit Singh', 
      role: 'Nail Technician',
      isAvailable: true, 
      phone: '+91 98765 33333',
      email: 'amit@salon.com',
      specialties: ['Manicure', 'Pedicure', 'Nail Art'],
      experience: '2 years',
      rating: 4.7,
      todayBookings: 3,
      todayRevenue: 1800,
      shift: '11:00-20:00',
      commission: 20
    }
  ]);

  // WebSocket connection and real-time updates
  useEffect(() => {
    // Connect to WebSocket server
    const newSocket = io('http://localhost:3001', {
      query: {
        userId: ownerData.id,
        userType: 'owner'
      }
    });

    setSocket(newSocket);

    // Join salon room
    newSocket.emit('join-salon-room', { salonId: ownerData.salonId });

    // Listen for real-time events
    newSocket.on('new-booking', (bookingData) => {
      toast.success(`New booking from ${bookingData.customerName}!`);
      setNotifications(prev => [...prev, {
        id: Date.now(),
        type: 'booking',
        message: `New booking: ${bookingData.customerName} - ${bookingData.service}`,
        time: new Date().toLocaleTimeString()
      }]);
      
      // Add to queue
      const newCustomer = {
        id: Date.now(),
        name: bookingData.customerName,
        service: bookingData.service,
        time: bookingData.time,
        status: 'Waiting',
        phone: bookingData.phone || 'N/A',
        amount: bookingData.totalAmount,
        duration: bookingData.duration || 30
      };
      
      setRecentCustomers(prev => [...prev, newCustomer]);
      handleQueueUpdate(1);
    });

    newSocket.on('queue-updated', (data) => {
      setQueueData(prev => ({
        ...prev,
        currentQueue: data.currentQueue,
        estimatedWaitTime: data.estimatedWaitTime
      }));
    });

    newSocket.on('payment-received', (data) => {
      toast.success(`Payment received: ₹${data.amount}`);
      setTodayStats(prev => ({
        ...prev,
        revenue: prev.revenue + data.amount
      }));
    });

    newSocket.on('notification', (notification) => {
      toast(notification.message, { 
        icon: notification.type === 'success' ? '✅' : 'ℹ️' 
      });
    });

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
    };
  }, [ownerData.id, ownerData.salonId]);

  // Simulate some real-time updates for demo
  useEffect(() => {
    const interval = setInterval(() => {
      // Randomly update queue (simulate customers coming/going)
      if (Math.random() > 0.8) {
        const change = Math.random() > 0.6 ? 1 : -1;
        setQueueData(prev => ({
          ...prev,
          currentQueue: Math.max(0, prev.currentQueue + change),
          estimatedWaitTime: Math.max(5, prev.estimatedWaitTime + (change * 5))
        }));
      }
    }, 15000); // Update every 15 seconds

    return () => clearInterval(interval);
  }, []);

  const handleQueueUpdate = (change) => {
    if (change === -1 && recentCustomers.length > 0) {
      // Remove the first customer (top of queue) when decreasing
      const completedCustomer = recentCustomers[0];
      setRecentCustomers(prev => prev.slice(1));
      
      // Update revenue
      setTodayStats(prev => ({
        ...prev,
        revenue: prev.revenue + completedCustomer.amount,
        totalCustomers: prev.totalCustomers + 1,
        customersSatisfied: prev.customersSatisfied + 1
      }));
      
      toast.success(`Payment received: ₹${completedCustomer.amount} from ${completedCustomer.name}`);
    } else if (change === 1) {
      // Add a random walk-in customer when increasing
      const walkInNames = [
        'Amit Kumar', 'Sneha Patel', 'Rajesh Singh', 'Pooja Sharma', 'Vikash Yadav',
        'Anita Gupta', 'Suresh Mehta', 'Kavita Jain', 'Rohit Verma', 'Deepika Shah',
        'Manoj Tiwari', 'Sunita Agarwal', 'Ashok Pandey', 'Ritu Malhotra', 'Sanjay Kumar'
      ];
      
      const services = ['Haircut', 'Beard Trim', 'Hair Styling', 'Facial', 'Manicure'];
      const prices = [300, 500, 700, 800, 400];
      
      const randomName = walkInNames[Math.floor(Math.random() * walkInNames.length)];
      const randomService = services[Math.floor(Math.random() * services.length)];
      const serviceIndex = services.indexOf(randomService);
      const price = prices[serviceIndex];
      
      const newCustomer = {
        id: Date.now(),
        name: randomName,
        service: randomService,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'Waiting',
        phone: `+91 ${Math.floor(Math.random() * 90000) + 10000} ${Math.floor(Math.random() * 90000) + 10000}`,
        amount: price,
        duration: Math.floor(Math.random() * 45) + 15,
        isPrepaid: Math.random() > 0.5, // 50% chance of being prepaid
        workStatus: 'waiting',
        operatorId: null
      };
      
      setRecentCustomers(prev => [...prev, newCustomer]);
      toast.success(`Walk-in customer added: ${randomName}`);
    }
    
    const newQueueData = {
      ...queueData,
      currentQueue: Math.max(0, queueData.currentQueue + change),
      estimatedWaitTime: Math.max(5, queueData.estimatedWaitTime + (change * 5))
    };
    
    setQueueData(newQueueData);
    
    // Emit to WebSocket for real-time updates
    if (socket) {
      socket.emit('update-queue', { 
        salonId: ownerData.salonId, 
        change: change 
      });
    }
  };

  const toggleShopStatus = () => {
    const newStatus = !queueData.isOpen;
    setQueueData(prev => ({
      ...prev,
      isOpen: newStatus
    }));
    
    // Emit to WebSocket
    if (socket) {
      socket.emit('toggle-salon-status', { 
        salonId: ownerData.salonId, 
        isOpen: newStatus 
      });
    }
    
    toast.success(`Shop ${newStatus ? 'opened' : 'closed'} successfully!`);
  };

  const completeCustomer = (customerId) => {
    const customer = recentCustomers.find(c => c.id === customerId);
    
    setRecentCustomers(prev => 
      prev.filter(customer => customer.id !== customerId)
    );
    
    handleQueueUpdate(-1);
    
    setTodayStats(prev => ({
      ...prev,
      totalCustomers: prev.totalCustomers + 1,
      customersSatisfied: prev.customersSatisfied + 1,
      revenue: prev.revenue + (customer?.amount || 0)
    }));
    
    // Emit service completion
    if (socket) {
      socket.emit('complete-service', { 
        bookingId: customerId, 
        salonId: ownerData.salonId 
      });
    }
    
    toast.success(`Service completed for ${customer?.name}!`);
  };

  const sendNotificationToCustomer = (customerId, message) => {
    const customer = recentCustomers.find(c => c.id === customerId);
    
    if (socket && customer) {
      socket.emit('send-notification', {
        targetUserId: `customer_${customerId}`,
        notification: {
          type: 'info',
          message: message,
          salonName: ownerData.name
        }
      });
    }
    
    toast.success(`Notification sent to ${customer?.name}!`);
  };

  const moveCustomerUp = (customerId) => {
    const customerIndex = recentCustomers.findIndex(c => c.id === customerId);
    if (customerIndex > 0) {
      const newCustomers = [...recentCustomers];
      [newCustomers[customerIndex], newCustomers[customerIndex - 1]] = 
      [newCustomers[customerIndex - 1], newCustomers[customerIndex]];
      setRecentCustomers(newCustomers);
      toast.success('Customer moved up in queue!');
    }
  };

  const handlePaymentReceived = (customer) => {
    // Remove customer from queue
    setRecentCustomers(prev => prev.filter(c => c.id !== customer.id));
    
    // Update stats
    setTodayStats(prev => ({
      ...prev,
      revenue: prev.revenue + customer.amount,
      totalCustomers: prev.totalCustomers + 1,
      customersSatisfied: prev.customersSatisfied + 1
    }));
    
    // Update queue count
    setQueueData(prev => ({
      ...prev,
      currentQueue: Math.max(0, prev.currentQueue - 1),
      estimatedWaitTime: Math.max(5, prev.estimatedWaitTime - 5)
    }));
    
    // Show success message
    toast.success(`💰 Payment received: ₹${customer.amount} from ${customer.name}`, {
      duration: 4000,
      style: {
        background: '#28a745',
        color: 'white',
        fontWeight: '600'
      }
    });
    
    // Emit to WebSocket
    if (socket) {
      socket.emit('payment-received', {
        salonId: ownerData.salonId,
        customerId: customer.id,
        customerName: customer.name,
        amount: customer.amount,
        service: customer.service
      });
    }
  };

  const startWork = (customerId) => {
    const availableStaff = staff.find(s => s.isAvailable);
    
    if (!availableStaff) {
      toast.error('No staff available. Please wait for one to become free.');
      return;
    }

    setRecentCustomers(prev => prev.map(customer => 
      customer.id === customerId 
        ? { 
            ...customer, 
            workStatus: 'ongoing', 
            status: 'In Progress',
            operatorId: availableStaff.id 
          }
        : customer
    ));

    // Mark staff as busy
    setStaff(prev => prev.map(s => 
      s.id === availableStaff.id ? { ...s, isAvailable: false } : s
    ));

    toast.success(`Work started with ${availableStaff.name}`);
  };

  const completeWork = (customerId) => {
    const customer = recentCustomers.find(c => c.id === customerId);
    
    if (customer && customer.operatorId) {
      // Free up the staff member and update their stats
      setStaff(prev => prev.map(s => 
        s.id === customer.operatorId 
          ? { 
              ...s, 
              isAvailable: true,
              todayBookings: s.todayBookings + 1,
              todayRevenue: s.todayRevenue + (customer.amount * s.commission / 100)
            }
          : s
      ));

      // Update customer history
      if (customerHistory[customer.name]) {
        setCustomerHistory(prev => ({
          ...prev,
          [customer.name]: {
            ...prev[customer.name],
            totalVisits: prev[customer.name].totalVisits + 1,
            totalSpent: prev[customer.name].totalSpent + customer.amount,
            lastVisit: new Date().toISOString().split('T')[0],
            loyaltyPoints: prev[customer.name].loyaltyPoints + Math.floor(customer.amount / 100)
          }
        }));
      } else {
        setCustomerHistory(prev => ({
          ...prev,
          [customer.name]: {
            totalVisits: 1,
            totalSpent: customer.amount,
            lastVisit: new Date().toISOString().split('T')[0],
            loyaltyPoints: Math.floor(customer.amount / 100),
            preferredServices: [customer.service],
            notes: 'New customer'
          }
        }));
      }
    }

    if (customer && customer.isPrepaid) {
      // For prepaid customers, just remove them and update stats
      setRecentCustomers(prev => prev.filter(c => c.id !== customerId));
      
      setTodayStats(prev => ({
        ...prev,
        totalCustomers: prev.totalCustomers + 1,
        customersSatisfied: prev.customersSatisfied + 1
      }));

      toast.success(`✅ Service completed for ${customer.name} (Prepaid)`);
    } else {
      // For non-prepaid customers, show payment pending
      setRecentCustomers(prev => prev.map(c => 
        c.id === customerId 
          ? { ...c, workStatus: 'completed', status: 'Payment Pending' }
          : c
      ));
      
      toast.info(`Service completed for ${customer.name}. Payment pending.`);
    }

    // Update queue
    setQueueData(prev => ({
      ...prev,
      currentQueue: Math.max(0, prev.currentQueue - 1),
      estimatedWaitTime: Math.max(5, prev.estimatedWaitTime - 5)
    }));
  };

  const addService = (serviceData) => {
    const newService = {
      id: Date.now(),
      ...serviceData
    };
    
    setQueueData(prev => ({
      ...prev,
      services: [...prev.services, newService]
    }));
    
    toast.success('Service added successfully!');
    setShowServiceModal(false);
  };

  const editService = (serviceId, serviceData) => {
    setQueueData(prev => ({
      ...prev,
      services: prev.services.map(service => 
        service.id === serviceId ? { ...service, ...serviceData } : service
      )
    }));
    
    toast.success('Service updated successfully!');
    setShowServiceModal(false);
    setEditingService(null);
  };

  const deleteService = (serviceId) => {
    setQueueData(prev => ({
      ...prev,
      services: prev.services.filter(service => service.id !== serviceId)
    }));
    
    toast.success('Service deleted successfully!');
  };

  // Appointment management functions
  const addAppointment = (appointmentData) => {
    const newAppointment = {
      id: Date.now(),
      ...appointmentData,
      status: 'confirmed'
    };
    
    setAppointments(prev => [...prev, newAppointment]);
    toast.success(`Appointment booked for ${appointmentData.customerName}!`);
    setShowAppointmentModal(false);
  };

  const cancelAppointment = (appointmentId) => {
    setAppointments(prev => prev.filter(apt => apt.id !== appointmentId));
    toast.success('Appointment cancelled successfully!');
  };

  const rescheduleAppointment = (appointmentId, newDate, newTime) => {
    setAppointments(prev => prev.map(apt => 
      apt.id === appointmentId 
        ? { ...apt, date: newDate, time: newTime }
        : apt
    ));
    toast.success('Appointment rescheduled successfully!');
  };

  // Staff management functions
  const addStaffMember = (staffData) => {
    const newStaff = {
      id: Date.now(),
      ...staffData,
      isAvailable: true,
      todayBookings: 0,
      todayRevenue: 0,
      rating: 4.0
    };
    
    setStaff(prev => [...prev, newStaff]);
    toast.success(`${staffData.name} added to staff!`);
    setShowStaffModal(false);
  };

  const updateStaffMember = (staffId, staffData) => {
    setStaff(prev => prev.map(s => 
      s.id === staffId ? { ...s, ...staffData } : s
    ));
    toast.success('Staff member updated successfully!');
  };

  const removeStaffMember = (staffId) => {
    setStaff(prev => prev.filter(s => s.id !== staffId));
    toast.success('Staff member removed successfully!');
  };

  // Inventory management functions
  const updateInventoryStock = (itemId, newStock) => {
    setInventory(prev => prev.map(item => 
      item.id === itemId ? { ...item, stock: newStock } : item
    ));
    toast.success('Inventory updated successfully!');
  };

  const addInventoryItem = (itemData) => {
    const newItem = {
      id: Date.now(),
      ...itemData
    };
    
    setInventory(prev => [...prev, newItem]);
    toast.success('New inventory item added!');
  };

  // Get today's appointments
  const getTodaysAppointments = () => {
    return appointments.filter(apt => apt.date === selectedDate);
  };

  // Get low stock items
  const getLowStockItems = () => {
    return inventory.filter(item => item.stock <= item.minStock);
  };

  return (
    <div className="owner-dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>💼 {ownerData.name}</h1>
          <p>Queue Management Dashboard</p>
          <div className="live-indicator">
            <span className="live-dot"></span>
            Live Updates Active
          </div>
        </div>
        <div className="header-right">
          <div className="notifications-badge">
            <button className="notifications-btn">
              🔔 
              {notifications.length > 0 && (
                <span className="badge">{notifications.length}</span>
              )}
            </button>
          </div>
          <div className="shop-status">
            <span className={`status-indicator ${queueData.isOpen ? 'open' : 'closed'}`}>
              {queueData.isOpen ? '🟢 Open' : '🔴 Closed'}
            </span>
            <button onClick={toggleShopStatus} className="toggle-status-btn">
              {queueData.isOpen ? 'Close Shop' : 'Open Shop'}
            </button>
          </div>
          <button onClick={onLogout} className="logout-btn">Logout</button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="dashboard-nav">
        <button 
          className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          📊 Dashboard
        </button>
        <button 
          className={`nav-tab ${activeTab === 'queue' ? 'active' : ''}`}
          onClick={() => setActiveTab('queue')}
        >
          👥 Queue
        </button>
        <button 
          className={`nav-tab ${activeTab === 'appointments' ? 'active' : ''}`}
          onClick={() => setActiveTab('appointments')}
        >
          📅 Appointments
        </button>
        <button 
          className={`nav-tab ${activeTab === 'staff' ? 'active' : ''}`}
          onClick={() => setActiveTab('staff')}
        >
          👨‍💼 Staff
        </button>
        <button 
          className={`nav-tab ${activeTab === 'customers' ? 'active' : ''}`}
          onClick={() => setActiveTab('customers')}
        >
          👤 Customers
        </button>
        <button 
          className={`nav-tab ${activeTab === 'inventory' ? 'active' : ''}`}
          onClick={() => setActiveTab('inventory')}
        >
          📦 Inventory
        </button>
        <button 
          className={`nav-tab ${activeTab === 'services' ? 'active' : ''}`}
          onClick={() => setActiveTab('services')}
        >
          💇 Services
        </button>
        <button 
          className={`nav-tab ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          📈 Analytics
        </button>
      </nav>

      <div className="dashboard-content">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="dashboard-tab">
            {/* Quick Stats */}
            <div className="stats-grid">
              <div className="stat-card primary">
                <div className="stat-icon">👥</div>
                <div className="stat-info">
                  <h3>{queueData.currentQueue}</h3>
                  <p>Current Queue</p>
                  <span className="stat-trend">+2 from yesterday</span>
                </div>
              </div>
              <div className="stat-card success">
                <div className="stat-icon">⏱️</div>
                <div className="stat-info">
                  <h3>{queueData.estimatedWaitTime}min</h3>
                  <p>Est. Wait Time</p>
                  <span className="stat-trend">-5min from avg</span>
                </div>
              </div>
              <div className="stat-card warning">
                <div className="stat-icon">💰</div>
                <div className="stat-info">
                  <h3>₹{todayStats.revenue}</h3>
                  <p>Today's Revenue</p>
                  <span className="stat-trend">+15% from yesterday</span>
                </div>
              </div>
              <div className="stat-card info">
                <div className="stat-icon">✅</div>
                <div className="stat-info">
                  <h3>{todayStats.customersSatisfied}</h3>
                  <p>Customers Served</p>
                  <span className="stat-trend">{todayStats.totalBookings} total bookings</span>
                </div>
              </div>
            </div>

            {/* Quick Overview */}
            <div className="dashboard-overview">
              <div className="overview-card">
                <h3>📋 Today's Summary</h3>
                <div className="summary-stats">
                  <div className="summary-item">
                    <span className="label">Total Bookings:</span>
                    <span className="value">{todayStats.totalBookings}</span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Completed:</span>
                    <span className="value success">{todayStats.customersSatisfied}</span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Cancelled:</span>
                    <span className="value error">{todayStats.cancelledBookings}</span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Avg Wait Time:</span>
                    <span className="value">{todayStats.avgWaitTime} min</span>
                  </div>
                </div>
              </div>

              <div className="overview-card">
                <h3>🚀 Quick Actions</h3>
                <div className="quick-actions-grid">
                  <button 
                    className="quick-action-btn"
                    onClick={() => setActiveTab('queue')}
                  >
                    👥 Manage Queue
                  </button>
                  <button 
                    className="quick-action-btn"
                    onClick={() => setActiveTab('services')}
                  >
                    💇 Edit Services
                  </button>
                  <button 
                    className="quick-action-btn"
                    onClick={() => toast.success('Notification sent to all customers!')}
                  >
                    📢 Send Alert
                  </button>
                  <button 
                    className="quick-action-btn"
                    onClick={() => setActiveTab('analytics')}
                  >
                    📊 View Reports
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Queue Management Tab */}
        {activeTab === 'queue' && (
          <div className="queue-tab">
            <div className="queue-header">
              <div className="queue-stats">
                <div className="queue-stat">
                  <div className="queue-number">{queueData.currentQueue}</div>
                  <div className="queue-label">People in Queue</div>
                </div>
                <div className="queue-stat">
                  <div className="wait-time-number">{queueData.estimatedWaitTime}</div>
                  <div className="wait-time-label">Minutes Wait</div>
                </div>
              </div>
              
              <div className="queue-controls">
                <button 
                  onClick={() => handleQueueUpdate(-1)}
                  className="queue-btn decrease"
                  disabled={queueData.currentQueue === 0}
                  title="Complete service & receive payment"
                >
                  💰 Payment Received
                </button>
                <button 
                  onClick={() => handleQueueUpdate(1)}
                  className="queue-btn increase"
                  title="Add walk-in customer"
                >
                  👤 Walk-in Customer
                </button>
                <button 
                  className="queue-btn refresh"
                  onClick={() => toast.success('Queue refreshed!')}
                >
                  🔄 Refresh
                </button>
              </div>
            </div>

            {/* Current Queue */}
            <div className="current-queue-section">
              <h3>📋 Current Queue ({recentCustomers.length} customers)</h3>
              {recentCustomers.length === 0 ? (
                <div className="empty-queue">
                  <div className="empty-icon">🎉</div>
                  <h4>No customers in queue!</h4>
                  <p>All caught up. Great job!</p>
                </div>
              ) : (
                <div className="customer-list">
                  {recentCustomers.map((customer, index) => (
                    <div key={customer.id} className="customer-card">
                      <div className="customer-position">#{index + 1}</div>
                      
                      <div className="customer-info">
                        <div className="customer-main">
                          <h4>{customer.name}</h4>
                          <p className="customer-service">{customer.service}</p>
                          <div className="customer-meta">
                            <span className="customer-time">🕐 {customer.time}</span>
                            <span className="customer-duration">⏱️ {customer.duration}min</span>
                            <span className="customer-amount">💰 ₹{customer.amount}</span>
                            {customer.isPrepaid && <span className="prepaid-badge">✅ Prepaid</span>}
                            {customer.workStatus === 'ongoing' && (
                              <span className="work-status">🔧 Operator {customer.operatorId}</span>
                            )}
                          </div>
                        </div>
                        
                        <div className="customer-contact">
                          <span className="customer-phone">📞 {customer.phone}</span>
                        </div>
                      </div>

                      <div className="customer-status">
                        <span className={`status-badge ${customer.status.toLowerCase().replace(' ', '-')}`}>
                          {customer.status}
                        </span>
                      </div>

                      <div className="customer-actions">
                        {index > 0 && customer.workStatus === 'waiting' && (
                          <button 
                            onClick={() => moveCustomerUp(customer.id)}
                            className="action-btn move-up"
                            title="Move up in queue"
                          >
                            ⬆️
                          </button>
                        )}
                        
                        {customer.workStatus === 'waiting' && (
                          <button 
                            onClick={() => startWork(customer.id)}
                            className="action-btn start-work"
                            title="Start work"
                          >
                            🔧
                          </button>
                        )}
                        
                        {customer.workStatus === 'ongoing' && (
                          <button 
                            onClick={() => completeWork(customer.id)}
                            className="action-btn complete-work"
                            title="Complete work"
                          >
                            ✅
                          </button>
                        )}
                        
                        {customer.workStatus === 'completed' && !customer.isPrepaid && (
                          <button 
                            onClick={() => handlePaymentReceived(customer)}
                            className="action-btn payment"
                            title="Payment Received"
                          >
                            💰
                          </button>
                        )}
                        
                        <button 
                          onClick={() => sendNotificationToCustomer(customer.id, "Your turn is coming up soon!")}
                          className="action-btn notify"
                          title="Send notification"
                        >
                          🔔
                        </button>
                        
                        <button 
                          onClick={() => {
                            setRecentCustomers(prev => prev.filter(c => c.id !== customer.id));
                            handleQueueUpdate(-1);
                            toast.success('Customer removed from queue');
                          }}
                          className="action-btn remove"
                          title="Remove from queue"
                        >
                          ❌
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Appointments Tab */}
        {activeTab === 'appointments' && (
          <div className="appointments-tab">
            <div className="appointments-header">
              <div className="appointments-controls">
                <h3>📅 Appointment Management</h3>
                <div className="date-selector">
                  <label>Select Date:</label>
                  <input 
                    type="date" 
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                </div>
                <button 
                  onClick={() => setShowAppointmentModal(true)}
                  className="add-appointment-btn primary"
                >
                  + Book Appointment
                </button>
              </div>
            </div>

            <div className="appointments-content">
              <div className="appointments-summary">
                <div className="summary-card">
                  <h4>📊 Today's Summary</h4>
                  <div className="summary-stats">
                    <div className="stat">
                      <span className="stat-number">{getTodaysAppointments().length}</span>
                      <span className="stat-label">Total Appointments</span>
                    </div>
                    <div className="stat">
                      <span className="stat-number">{getTodaysAppointments().filter(apt => apt.status === 'confirmed').length}</span>
                      <span className="stat-label">Confirmed</span>
                    </div>
                    <div className="stat">
                      <span className="stat-number">₹{getTodaysAppointments().reduce((sum, apt) => sum + apt.amount, 0)}</span>
                      <span className="stat-label">Expected Revenue</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="appointments-timeline">
                <h4>🕐 Schedule for {new Date(selectedDate).toLocaleDateString()}</h4>
                {getTodaysAppointments().length === 0 ? (
                  <div className="no-appointments">
                    <div className="empty-icon">📅</div>
                    <h4>No appointments scheduled</h4>
                    <p>Book your first appointment for this date!</p>
                  </div>
                ) : (
                  <div className="appointments-list">
                    {getTodaysAppointments()
                      .sort((a, b) => a.time.localeCompare(b.time))
                      .map(appointment => (
                      <div key={appointment.id} className="appointment-card">
                        <div className="appointment-time">
                          <div className="time-display">{appointment.time}</div>
                          <div className="duration">{appointment.duration}min</div>
                        </div>
                        
                        <div className="appointment-details">
                          <h4>{appointment.customerName}</h4>
                          <p className="service">{appointment.service}</p>
                          <div className="appointment-meta">
                            <span className="phone">📞 {appointment.customerPhone}</span>
                            <span className="amount">💰 ₹{appointment.amount}</span>
                            <span className="staff">👨‍💼 {staff.find(s => s.id === appointment.operatorId)?.name}</span>
                          </div>
                          {appointment.notes && (
                            <p className="appointment-notes">📝 {appointment.notes}</p>
                          )}
                        </div>

                        <div className="appointment-status">
                          <span className={`status-badge ${appointment.status}`}>
                            {appointment.status}
                          </span>
                        </div>

                        <div className="appointment-actions">
                          <button 
                            onClick={() => {
                              // Convert appointment to walk-in customer
                              const newCustomer = {
                                id: Date.now(),
                                name: appointment.customerName,
                                service: appointment.service,
                                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                                status: 'Waiting',
                                phone: appointment.customerPhone,
                                amount: appointment.amount,
                                duration: appointment.duration,
                                isPrepaid: true,
                                workStatus: 'waiting',
                                operatorId: null
                              };
                              setRecentCustomers(prev => [...prev, newCustomer]);
                              toast.success(`${appointment.customerName} added to queue!`);
                            }}
                            className="action-btn add-to-queue"
                            title="Add to Queue"
                          >
                            👥
                          </button>
                          <button 
                            onClick={() => cancelAppointment(appointment.id)}
                            className="action-btn cancel"
                            title="Cancel Appointment"
                          >
                            ❌
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Staff Management Tab */}
        {activeTab === 'staff' && (
          <div className="staff-tab">
            <div className="staff-header">
              <h3>👨‍💼 Staff Management</h3>
              <button 
                onClick={() => setShowStaffModal(true)}
                className="add-staff-btn primary"
              >
                + Add Staff Member
              </button>
            </div>

            <div className="staff-grid">
              {staff.map(member => (
                <div key={member.id} className="staff-card">
                  <div className="staff-header-info">
                    <div className="staff-avatar">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="staff-basic">
                      <h4>{member.name}</h4>
                      <p className="staff-role">{member.role}</p>
                      <div className="staff-status">
                        <span className={`availability-badge ${member.isAvailable ? 'available' : 'busy'}`}>
                          {member.isAvailable ? '🟢 Available' : '🔴 Busy'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="staff-details">
                    <div className="staff-contact">
                      <p>📞 {member.phone}</p>
                      <p>📧 {member.email}</p>
                    </div>
                    
                    <div className="staff-info">
                      <div className="info-item">
                        <span className="label">Experience:</span>
                        <span className="value">{member.experience}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Rating:</span>
                        <span className="value">⭐ {member.rating}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Shift:</span>
                        <span className="value">{member.shift}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Commission:</span>
                        <span className="value">{member.commission}%</span>
                      </div>
                    </div>

                    <div className="staff-specialties">
                      <h5>Specialties:</h5>
                      <div className="specialties-tags">
                        {member.specialties.map(specialty => (
                          <span key={specialty} className="specialty-tag">{specialty}</span>
                        ))}
                      </div>
                    </div>

                    <div className="staff-today-stats">
                      <h5>Today's Performance:</h5>
                      <div className="today-stats">
                        <div className="stat">
                          <span className="stat-number">{member.todayBookings}</span>
                          <span className="stat-label">Bookings</span>
                        </div>
                        <div className="stat">
                          <span className="stat-number">₹{member.todayRevenue}</span>
                          <span className="stat-label">Revenue</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="staff-actions">
                    <button 
                      onClick={() => {
                        setStaff(prev => prev.map(s => 
                          s.id === member.id 
                            ? { ...s, isAvailable: !s.isAvailable }
                            : s
                        ));
                        toast.success(`${member.name} marked as ${member.isAvailable ? 'busy' : 'available'}`);
                      }}
                      className={`action-btn ${member.isAvailable ? 'mark-busy' : 'mark-available'}`}
                    >
                      {member.isAvailable ? '🔴 Mark Busy' : '🟢 Mark Available'}
                    </button>
                    <button 
                      onClick={() => removeStaffMember(member.id)}
                      className="action-btn remove"
                    >
                      🗑️ Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Customer Management Tab */}
        {activeTab === 'customers' && (
          <div className="customers-tab">
            <div className="customers-header">
              <h3>👤 Customer Management & Loyalty</h3>
              <div className="customers-stats">
                <div className="customer-stat">
                  <span className="stat-number">{Object.keys(customerHistory).length}</span>
                  <span className="stat-label">Total Customers</span>
                </div>
                <div className="customer-stat">
                  <span className="stat-number">
                    ₹{Object.values(customerHistory).reduce((sum, customer) => sum + customer.totalSpent, 0)}
                  </span>
                  <span className="stat-label">Total Revenue</span>
                </div>
              </div>
            </div>

            <div className="customers-list">
              {Object.entries(customerHistory).map(([customerName, history]) => (
                <div key={customerName} className="customer-history-card">
                  <div className="customer-header">
                    <div className="customer-avatar">
                      {customerName.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="customer-basic">
                      <h4>{customerName}</h4>
                      <div className="customer-loyalty">
                        <span className="loyalty-points">🏆 {history.loyaltyPoints} points</span>
                        <span className="visit-count">👥 {history.totalVisits} visits</span>
                      </div>
                    </div>
                  </div>

                  <div className="customer-details">
                    <div className="customer-stats">
                      <div className="stat">
                        <span className="label">Total Spent:</span>
                        <span className="value">₹{history.totalSpent}</span>
                      </div>
                      <div className="stat">
                        <span className="label">Last Visit:</span>
                        <span className="value">{new Date(history.lastVisit).toLocaleDateString()}</span>
                      </div>
                      <div className="stat">
                        <span className="label">Avg per Visit:</span>
                        <span className="value">₹{Math.round(history.totalSpent / history.totalVisits)}</span>
                      </div>
                    </div>

                    <div className="preferred-services">
                      <h5>Preferred Services:</h5>
                      <div className="services-tags">
                        {history.preferredServices.map(service => (
                          <span key={service} className="service-tag">{service}</span>
                        ))}
                      </div>
                    </div>

                    {history.notes && (
                      <div className="customer-notes">
                        <h5>Notes:</h5>
                        <p>{history.notes}</p>
                      </div>
                    )}

                    <div className="loyalty-rewards">
                      <h5>Available Rewards:</h5>
                      <div className="rewards-list">
                        {history.loyaltyPoints >= 100 && (
                          <span className="reward-badge">🎁 Free Service (100 pts)</span>
                        )}
                        {history.loyaltyPoints >= 50 && (
                          <span className="reward-badge">💰 10% Discount (50 pts)</span>
                        )}
                        {history.loyaltyPoints >= 25 && (
                          <span className="reward-badge">☕ Free Refreshment (25 pts)</span>
                        )}
                        {history.loyaltyPoints < 25 && (
                          <span className="reward-badge inactive">Earn more points for rewards</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Inventory Management Tab */}
        {activeTab === 'inventory' && (
          <div className="inventory-tab">
            <div className="inventory-header">
              <h3>📦 Inventory Management</h3>
              <div className="inventory-alerts">
                {getLowStockItems().length > 0 && (
                  <div className="low-stock-alert">
                    ⚠️ {getLowStockItems().length} items running low on stock!
                  </div>
                )}
              </div>
            </div>

            <div className="inventory-summary">
              <div className="inventory-stats">
                <div className="inventory-stat">
                  <span className="stat-number">{inventory.length}</span>
                  <span className="stat-label">Total Items</span>
                </div>
                <div className="inventory-stat">
                  <span className="stat-number">{getLowStockItems().length}</span>
                  <span className="stat-label">Low Stock</span>
                </div>
                <div className="inventory-stat">
                  <span className="stat-number">
                    ₹{inventory.reduce((sum, item) => sum + (item.stock * item.price), 0)}
                  </span>
                  <span className="stat-label">Total Value</span>
                </div>
              </div>
            </div>

            <div className="inventory-grid">
              {inventory.map(item => (
                <div key={item.id} className={`inventory-card ${item.stock <= item.minStock ? 'low-stock' : ''}`}>
                  <div className="item-header">
                    <h4>{item.name}</h4>
                    <span className="item-category">{item.category}</span>
                  </div>

                  <div className="item-details">
                    <div className="stock-info">
                      <div className="stock-level">
                        <span className="current-stock">{item.stock}</span>
                        <span className="stock-label">in stock</span>
                      </div>
                      {item.stock <= item.minStock && (
                        <div className="low-stock-warning">
                          ⚠️ Below minimum ({item.minStock})
                        </div>
                      )}
                    </div>

                    <div className="item-info">
                      <div className="info-row">
                        <span className="label">Price:</span>
                        <span className="value">₹{item.price}</span>
                      </div>
                      <div className="info-row">
                        <span className="label">Supplier:</span>
                        <span className="value">{item.supplier}</span>
                      </div>
                      <div className="info-row">
                        <span className="label">Total Value:</span>
                        <span className="value">₹{item.stock * item.price}</span>
                      </div>
                    </div>
                  </div>

                  <div className="item-actions">
                    <div className="stock-controls">
                      <button 
                        onClick={() => updateInventoryStock(item.id, Math.max(0, item.stock - 1))}
                        className="stock-btn decrease"
                      >
                        -
                      </button>
                      <span className="stock-display">{item.stock}</span>
                      <button 
                        onClick={() => updateInventoryStock(item.id, item.stock + 1)}
                        className="stock-btn increase"
                      >
                        +
                      </button>
                    </div>
                    {item.stock <= item.minStock && (
                      <button 
                        onClick={() => {
                          updateInventoryStock(item.id, item.minStock + 10);
                          toast.success(`Restocked ${item.name}!`);
                        }}
                        className="restock-btn"
                      >
                        📦 Restock
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Services Management Tab */}
        {activeTab === 'services' && (
          <div className="services-tab">
            <div className="services-header">
              <h3>💇 Service Management</h3>
              <button 
                onClick={() => setShowServiceModal(true)}
                className="add-service-btn primary"
              >
                + Add New Service
              </button>
            </div>

            <div className="services-grid">
              {queueData.services.map(service => (
                <div key={service.id} className="service-card">
                  <div className="service-header">
                    <h4>{service.name}</h4>
                    <span className="service-category">{service.category}</span>
                  </div>
                  
                  <div className="service-details">
                    <div className="service-detail">
                      <span className="label">Duration:</span>
                      <span className="value">{service.duration} min</span>
                    </div>
                    <div className="service-detail">
                      <span className="label">Price:</span>
                      <span className="value">₹{service.price}</span>
                    </div>
                  </div>

                  <div className="service-actions">
                    <button 
                      onClick={() => {
                        setEditingService(service);
                        setShowServiceModal(true);
                      }}
                      className="service-action-btn edit"
                    >
                      ✏️ Edit
                    </button>
                    <button 
                      onClick={() => deleteService(service.id)}
                      className="service-action-btn delete"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="analytics-tab">
            <h3>📈 Business Analytics</h3>
            
            <div className="analytics-grid">
              <div className="analytics-card">
                <h4>📊 Revenue Trends</h4>
                <div className="revenue-chart">
                  <div className="chart-placeholder">
                    <p>Daily Revenue: ₹{todayStats.revenue}</p>
                    <p>Weekly Average: ₹{Math.round(todayStats.revenue * 6.2)}</p>
                    <p>Monthly Target: ₹{Math.round(todayStats.revenue * 28)}</p>
                  </div>
                </div>
              </div>

              <div className="analytics-card">
                <h4>👥 Customer Analytics</h4>
                <div className="customer-analytics">
                  <div className="metric">
                    <span className="metric-label">Peak Hours:</span>
                    <span className="metric-value">2:00 PM - 4:00 PM</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Popular Service:</span>
                    <span className="metric-value">Haircut & Styling</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Customer Satisfaction:</span>
                    <span className="metric-value">4.8/5 ⭐</span>
                  </div>
                </div>
              </div>

              <div className="analytics-card">
                <h4>⏱️ Time Analytics</h4>
                <div className="time-analytics">
                  <div className="metric">
                    <span className="metric-label">Avg Service Time:</span>
                    <span className="metric-value">{Math.round(queueData.services.reduce((acc, s) => acc + s.duration, 0) / queueData.services.length)} min</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Queue Efficiency:</span>
                    <span className="metric-value">92%</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">No-show Rate:</span>
                    <span className="metric-value">3%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="settings-tab">
            <h3>⚙️ Salon Settings</h3>
            
            <div className="settings-sections">
              <div className="settings-section">
                <h4>🏪 Salon Information</h4>
                <div className="setting-item">
                  <label>Salon Name:</label>
                  <input type="text" defaultValue={ownerData.name} />
                </div>
                <div className="setting-item">
                  <label>Contact Number:</label>
                  <input type="tel" defaultValue="+91 98765 43210" />
                </div>
                <div className="setting-item">
                  <label>Address:</label>
                  <textarea defaultValue="123 Beauty Street, Fashion District, Mumbai 400001"></textarea>
                </div>
              </div>

              <div className="settings-section">
                <h4>⏰ Operating Hours</h4>
                <div className="hours-grid">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                    <div key={day} className="day-hours">
                      <span className="day-label">{day}:</span>
                      <input type="time" defaultValue="09:00" />
                      <span>to</span>
                      <input type="time" defaultValue="20:00" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="settings-section">
                <h4>🔔 Notifications</h4>
                <div className="notification-settings">
                  <label className="setting-toggle">
                    <input type="checkbox" defaultChecked />
                    <span>Email notifications for new bookings</span>
                  </label>
                  <label className="setting-toggle">
                    <input type="checkbox" defaultChecked />
                    <span>SMS alerts for queue updates</span>
                  </label>
                  <label className="setting-toggle">
                    <input type="checkbox" />
                    <span>Push notifications on mobile</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="settings-actions">
              <button className="save-settings-btn">💾 Save Settings</button>
              <button className="reset-settings-btn">🔄 Reset to Default</button>
            </div>
          </div>
        )}
      </div>

      {/* Service Modal */}
      {showServiceModal && (
        <ServiceModal
          service={editingService}
          onSave={editingService ? 
            (data) => editService(editingService.id, data) : 
            addService
          }
          onClose={() => {
            setShowServiceModal(false);
            setEditingService(null);
          }}
        />
      )}

      {/* Appointment Modal */}
      {showAppointmentModal && (
        <AppointmentModal
          onSave={addAppointment}
          onClose={() => setShowAppointmentModal(false)}
          services={queueData.services}
          staff={staff}
        />
      )}

      {/* Staff Modal */}
      {showStaffModal && (
        <StaffModal
          onSave={addStaffMember}
          onClose={() => setShowStaffModal(false)}
        />
      )}
    </div>
  );
};

// Service Modal Component
const ServiceModal = ({ service, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: service?.name || '',
    duration: service?.duration || 30,
    price: service?.price || 500,
    category: service?.category || 'Hair'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'duration' || name === 'price' ? parseInt(value) : value
    }));
  };

  return (
    <div className="modal-overlay">
      <div className="service-modal">
        <div className="modal-header">
          <h3>{service ? 'Edit Service' : 'Add New Service'}</h3>
          <button onClick={onClose} className="close-modal-btn">×</button>
        </div>

        <form onSubmit={handleSubmit} className="service-form">
          <div className="form-group">
            <label>Service Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Haircut & Styling"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Duration (minutes) *</label>
              <input
                type="number"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                min="5"
                max="300"
                required
              />
            </div>

            <div className="form-group">
              <label>Price (₹) *</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                min="50"
                max="10000"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Category *</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            >
              <option value="Hair">Hair</option>
              <option value="Skincare">Skincare</option>
              <option value="Nails">Nails</option>
              <option value="Spa">Spa</option>
              <option value="Makeup">Makeup</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="cancel-btn">
              Cancel
            </button>
            <button type="submit" className="save-btn">
              {service ? 'Update Service' : 'Add Service'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Appointment Modal Component
const AppointmentModal = ({ onSave, onClose, services, staff }) => {
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    service: '',
    date: new Date().toISOString().split('T')[0],
    time: '',
    operatorId: '',
    notes: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const selectedService = services.find(s => s.name === formData.service);
    const appointmentData = {
      ...formData,
      duration: selectedService?.duration || 30,
      amount: selectedService?.price || 500,
      operatorId: parseInt(formData.operatorId)
    };
    onSave(appointmentData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="modal-overlay">
      <div className="appointment-modal">
        <div className="modal-header">
          <h3>📅 Book New Appointment</h3>
          <button onClick={onClose} className="close-modal-btn">×</button>
        </div>

        <form onSubmit={handleSubmit} className="appointment-form">
          <div className="form-row">
            <div className="form-group">
              <label>Customer Name *</label>
              <input
                type="text"
                name="customerName"
                value={formData.customerName}
                onChange={handleChange}
                placeholder="Enter customer name"
                required
              />
            </div>

            <div className="form-group">
              <label>Phone Number *</label>
              <input
                type="tel"
                name="customerPhone"
                value={formData.customerPhone}
                onChange={handleChange}
                placeholder="+91 98765 43210"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Service *</label>
              <select
                name="service"
                value={formData.service}
                onChange={handleChange}
                required
              >
                <option value="">Select a service</option>
                {services.map(service => (
                  <option key={service.id} value={service.name}>
                    {service.name} - ₹{service.price} ({service.duration}min)
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Staff Member *</label>
              <select
                name="operatorId"
                value={formData.operatorId}
                onChange={handleChange}
                required
              >
                <option value="">Select staff member</option>
                {staff.map(member => (
                  <option key={member.id} value={member.id}>
                    {member.name} - {member.role}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Date *</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            <div className="form-group">
              <label>Time *</label>
              <input
                type="time"
                name="time"
                value={formData.time}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Any special requests or notes..."
              rows="3"
            />
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="cancel-btn">
              Cancel
            </button>
            <button type="submit" className="save-btn">
              Book Appointment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Staff Modal Component
const StaffModal = ({ onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    phone: '',
    email: '',
    specialties: [],
    experience: '',
    shift: '',
    commission: 25
  });

  const [specialtyInput, setSpecialtyInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      commission: parseInt(formData.commission)
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addSpecialty = () => {
    if (specialtyInput.trim() && !formData.specialties.includes(specialtyInput.trim())) {
      setFormData(prev => ({
        ...prev,
        specialties: [...prev.specialties, specialtyInput.trim()]
      }));
      setSpecialtyInput('');
    }
  };

  const removeSpecialty = (specialty) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.filter(s => s !== specialty)
    }));
  };

  return (
    <div className="modal-overlay">
      <div className="staff-modal">
        <div className="modal-header">
          <h3>👨‍💼 Add New Staff Member</h3>
          <button onClick={onClose} className="close-modal-btn">×</button>
        </div>

        <form onSubmit={handleSubmit} className="staff-form">
          <div className="form-row">
            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter full name"
                required
              />
            </div>

            <div className="form-group">
              <label>Role *</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
              >
                <option value="">Select role</option>
                <option value="Senior Stylist">Senior Stylist</option>
                <option value="Junior Stylist">Junior Stylist</option>
                <option value="Beauty Specialist">Beauty Specialist</option>
                <option value="Nail Technician">Nail Technician</option>
                <option value="Massage Therapist">Massage Therapist</option>
                <option value="Receptionist">Receptionist</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Phone Number *</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91 98765 43210"
                required
              />
            </div>

            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="email@example.com"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Experience *</label>
              <input
                type="text"
                name="experience"
                value={formData.experience}
                onChange={handleChange}
                placeholder="e.g., 3 years"
                required
              />
            </div>

            <div className="form-group">
              <label>Commission (%) *</label>
              <input
                type="number"
                name="commission"
                value={formData.commission}
                onChange={handleChange}
                min="0"
                max="50"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Work Shift *</label>
            <input
              type="text"
              name="shift"
              value={formData.shift}
              onChange={handleChange}
              placeholder="e.g., 09:00-18:00"
              required
            />
          </div>

          <div className="form-group">
            <label>Specialties</label>
            <div className="specialty-input">
              <input
                type="text"
                value={specialtyInput}
                onChange={(e) => setSpecialtyInput(e.target.value)}
                placeholder="Add a specialty"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecialty())}
              />
              <button type="button" onClick={addSpecialty} className="add-specialty-btn">
                Add
              </button>
            </div>
            <div className="specialties-list">
              {formData.specialties.map(specialty => (
                <span key={specialty} className="specialty-tag">
                  {specialty}
                  <button 
                    type="button" 
                    onClick={() => removeSpecialty(specialty)}
                    className="remove-specialty"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="cancel-btn">
              Cancel
            </button>
            <button type="submit" className="save-btn">
              Add Staff Member
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OwnerDashboard;
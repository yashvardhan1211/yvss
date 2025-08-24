import React, { useState, useEffect } from 'react';
import './OwnerDashboard.css';

const OwnerDashboard = ({ ownerData, onLogout }) => {
  const [queueData, setQueueData] = useState({
    currentQueue: 5,
    estimatedWaitTime: 25,
    isOpen: true,
    services: [
      { id: 1, name: 'Haircut', duration: 30, price: 25 },
      { id: 2, name: 'Hair Styling', duration: 45, price: 35 },
      { id: 3, name: 'Facial', duration: 60, price: 50 },
      { id: 4, name: 'Beard Trim', duration: 15, price: 15 }
    ]
  });

  const [todayStats, setTodayStats] = useState({
    totalCustomers: 23,
    revenue: 875,
    avgWaitTime: 18,
    customersSatisfied: 21
  });

  const [recentCustomers, setRecentCustomers] = useState([
    { id: 1, name: 'John D.', service: 'Haircut', time: '2:30 PM', status: 'In Progress' },
    { id: 2, name: 'Sarah M.', service: 'Facial', time: '2:45 PM', status: 'Waiting' },
    { id: 3, name: 'Mike R.', service: 'Beard Trim', time: '3:00 PM', status: 'Waiting' },
    { id: 4, name: 'Lisa K.', service: 'Hair Styling', time: '3:15 PM', status: 'Waiting' },
    { id: 5, name: 'David L.', service: 'Haircut', time: '3:30 PM', status: 'Waiting' }
  ]);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Randomly update queue (simulate customers coming/going)
      if (Math.random() > 0.7) {
        setQueueData(prev => ({
          ...prev,
          currentQueue: Math.max(0, prev.currentQueue + (Math.random() > 0.5 ? 1 : -1)),
          estimatedWaitTime: Math.max(5, prev.estimatedWaitTime + (Math.random() > 0.5 ? 5 : -5))
        }));
      }
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const handleQueueUpdate = (change) => {
    setQueueData(prev => ({
      ...prev,
      currentQueue: Math.max(0, prev.currentQueue + change),
      estimatedWaitTime: Math.max(5, prev.estimatedWaitTime + (change * 5))
    }));
  };

  const toggleShopStatus = () => {
    setQueueData(prev => ({
      ...prev,
      isOpen: !prev.isOpen
    }));
  };

  const completeCustomer = (customerId) => {
    setRecentCustomers(prev => 
      prev.filter(customer => customer.id !== customerId)
    );
    handleQueueUpdate(-1);
    setTodayStats(prev => ({
      ...prev,
      totalCustomers: prev.totalCustomers + 1,
      customersSatisfied: prev.customersSatisfied + 1
    }));
  };

  return (
    <div className="owner-dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>💼 {ownerData.name}</h1>
          <p>Queue Management Dashboard</p>
        </div>
        <div className="header-right">
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

      <div className="dashboard-content">
        {/* Quick Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-info">
              <h3>{queueData.currentQueue}</h3>
              <p>Current Queue</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⏱️</div>
            <div className="stat-info">
              <h3>{queueData.estimatedWaitTime}min</h3>
              <p>Est. Wait Time</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-info">
              <h3>${todayStats.revenue}</h3>
              <p>Today's Revenue</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-info">
              <h3>{todayStats.customersSatisfied}</h3>
              <p>Customers Served</p>
            </div>
          </div>
        </div>

        <div className="dashboard-main">
          {/* Queue Management */}
          <div className="queue-management">
            <div className="section-header">
              <h2>🎯 Queue Management</h2>
              <div className="queue-controls">
                <button 
                  onClick={() => handleQueueUpdate(-1)}
                  className="queue-btn decrease"
                  disabled={queueData.currentQueue === 0}
                >
                  -1 Customer
                </button>
                <button 
                  onClick={() => handleQueueUpdate(1)}
                  className="queue-btn increase"
                >
                  +1 Customer
                </button>
              </div>
            </div>

            <div className="current-queue">
              <div className="queue-display">
                <div className="queue-number">{queueData.currentQueue}</div>
                <div className="queue-label">People in Queue</div>
              </div>
              <div className="wait-time-display">
                <div className="wait-time-number">{queueData.estimatedWaitTime}</div>
                <div className="wait-time-label">Minutes Wait</div>
              </div>
            </div>

            {/* Recent Customers */}
            <div className="recent-customers">
              <h3>📋 Current Queue</h3>
              {recentCustomers.length === 0 ? (
                <div className="empty-queue">
                  <p>🎉 No customers in queue!</p>
                </div>
              ) : (
                <div className="customer-list">
                  {recentCustomers.map((customer, index) => (
                    <div key={customer.id} className="customer-item">
                      <div className="customer-info">
                        <div className="customer-number">#{index + 1}</div>
                        <div className="customer-details">
                          <h4>{customer.name}</h4>
                          <p>{customer.service} • {customer.time}</p>
                        </div>
                      </div>
                      <div className="customer-actions">
                        <span className={`status ${customer.status.toLowerCase().replace(' ', '-')}`}>
                          {customer.status}
                        </span>
                        <button 
                          onClick={() => completeCustomer(customer.id)}
                          className="complete-btn"
                        >
                          ✅ Complete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Services & Settings */}
          <div className="services-panel">
            <h2>⚙️ Services & Settings</h2>
            
            <div className="services-list">
              <h3>💇 Available Services</h3>
              {queueData.services.map(service => (
                <div key={service.id} className="service-item">
                  <div className="service-info">
                    <h4>{service.name}</h4>
                    <p>{service.duration}min • ${service.price}</p>
                  </div>
                  <button className="edit-service-btn">Edit</button>
                </div>
              ))}
              <button className="add-service-btn">+ Add Service</button>
            </div>

            <div className="quick-actions">
              <h3>🚀 Quick Actions</h3>
              <button className="action-btn">📢 Send Notification</button>
              <button className="action-btn">📊 View Analytics</button>
              <button className="action-btn">⚙️ Shop Settings</button>
              <button className="action-btn">💬 Customer Feedback</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OwnerDashboard;
// src/components/SalonList.js
import React, { useState } from 'react';
import './SalonList.css';

const SalonList = ({ salons, onSalonSelect, loading, error }) => {
  const [sortBy, setSortBy] = useState('distance');
  const [filterType, setFilterType] = useState('all');

  // Sort salons based on selected criteria
  const sortedSalons = [...salons].sort((a, b) => {
    switch (sortBy) {
      case 'distance':
        return (a.distance || 0) - (b.distance || 0);
      case 'rating':
        return (b.rating || 0) - (a.rating || 0);
      case 'waitTime':
        return (a.waitTime || 0) - (b.waitTime || 0);
      case 'queue':
        return (a.queueLength || 0) - (b.queueLength || 0);
      default:
        return 0;
    }
  });

  // Filter salons by type
  const filteredSalons = sortedSalons.filter(salon => {
    if (filterType === 'all') return true;
    if (filterType === 'open') return salon.opening_hours?.open_now === true;
    if (filterType === 'unisex') return salon.type.toLowerCase().includes('unisex');
    if (filterType === 'ladies') return salon.type.toLowerCase().includes('ladies');
    if (filterType === 'barber') return salon.type.toLowerCase().includes('barber');
    return true;
  });

  const handleCall = (phoneNumber) => {
    if (phoneNumber) {
      window.open(`tel:${phoneNumber.replace(/\s/g, '')}`, '_self');
    }
  };

  const handleDirections = (salon) => {
    const { lat, lng } = salon.geometry.location;
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
  };

  if (loading && salons.length === 0) {
    return (
      <div className="salon-list loading">
        <div className="loading-content">
          <div className="spinner"></div>
          <p>Searching for salons...</p>
        </div>
      </div>
    );
  }

  if (error && salons.length === 0) {
    return (
      <div className="salon-list error">
        <div className="error-content">
          <h3>😔 No Results Found</h3>
          <p>{error}</p>
          <div className="suggestions">
            <h4>Try:</h4>
            <ul>
              <li>Searching a different area</li>
              <li>Using a broader location (city instead of specific address)</li>
              <li>Checking your internet connection</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="salon-list">
      <div className="salon-list-header">
        <div className="results-info">
          <h2>
            Found {filteredSalons.length} salon{filteredSalons.length !== 1 ? 's' : ''}
          </h2>
          <p>Real businesses from Google Maps within 3km</p>
        </div>

        <div className="controls">
          <div className="sort-control">
            <label>Sort by:</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="distance">Distance</option>
              <option value="rating">Rating</option>
              <option value="waitTime">Wait Time</option>
              <option value="queue">Queue Length</option>
            </select>
          </div>

          <div className="filter-control">
            <label>Filter:</label>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="all">All Types</option>
              <option value="open">Open Now</option>
              <option value="unisex">Unisex</option>
              <option value="ladies">Ladies</option>
              <option value="barber">Barber Shops</option>
            </select>
          </div>
        </div>
      </div>

      <div className="salon-cards">
        {filteredSalons.map((salon) => (
          <div key={salon.place_id} className="salon-card">
            <div className="salon-card-header">
              <div className="salon-info">
                <h3 className="salon-name">{salon.name}</h3>
                <span className="salon-type">{salon.type}</span>
                
                <div className="salon-meta">
                  <div className="rating">
                    <span className="stars">
                      {'★'.repeat(Math.floor(salon.rating || 0))}
                      {'☆'.repeat(5 - Math.floor(salon.rating || 0))}
                    </span>
                    <span className="rating-text">
                      {salon.rating?.toFixed(1) || 'N/A'} 
                      ({salon.user_ratings_total || 0} reviews)
                    </span>
                  </div>
                  
                  <div className="distance">
                    {salon.distance?.toFixed(1)}km away
                  </div>
                </div>
              </div>

              <div className={`status ${salon.opening_hours?.open_now ? 'open' : 'closed'}`}>
                {salon.opening_hours?.open_now === true ? 'Open' : 
                 salon.opening_hours?.open_now === false ? 'Closed' : 'Unknown'}
              </div>
            </div>

            <div className="salon-card-body">
              <div className="address">
                {salon.vicinity || salon.formatted_address}
              </div>

              <div className="queue-info">
                <div className="queue-stat">
                  <span className="icon">Queue:</span>
                  <span>{salon.queueLength}</span>
                </div>
                <div className="wait-stat">
                  <span className="icon">Wait:</span>
                  <span>~{salon.waitTime} min</span>
                </div>
              </div>

              <div 
                style={{
                  backgroundColor: '#ffff00',
                  border: '3px solid #ff0000',
                  padding: '12px',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  display: 'block',
                  width: '100%',
                  boxSizing: 'border-box'
                }}
              >
                <div style={{
                  color: '#000000',
                  fontSize: '18px',
                  fontWeight: '800',
                  marginBottom: '8px'
                }}>Services:</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  <span style={{
                    backgroundColor: '#ff4444',
                    color: '#ffffff',
                    padding: '8px 12px',
                    fontSize: '14px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    borderRadius: '6px',
                    display: 'inline-block'
                  }}>HAIRCUT</span>
                  <span style={{
                    backgroundColor: '#ff4444',
                    color: '#ffffff',
                    padding: '8px 12px',
                    fontSize: '14px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    borderRadius: '6px',
                    display: 'inline-block'
                  }}>STYLING</span>
                  <span style={{
                    backgroundColor: '#ff4444',
                    color: '#ffffff',
                    padding: '8px 12px',
                    fontSize: '14px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    borderRadius: '6px',
                    display: 'inline-block'
                  }}>FACIAL</span>
                  <span style={{
                    backgroundColor: '#ff4444',
                    color: '#ffffff',
                    padding: '8px 12px',
                    fontSize: '14px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    borderRadius: '6px',
                    display: 'inline-block'
                  }}>+2 MORE</span>
                </div>
              </div>

              {salon.price_level && (
                <div className="price-level">
                  <strong>Price:</strong>
                  <span className="price-symbols">
                    {'₹'.repeat(salon.price_level)}
                    {'○'.repeat(4 - salon.price_level)}
                  </span>
                  <span className="price-text">
                    ({salon.price_level === 1 ? 'Budget' : 
                      salon.price_level === 2 ? 'Moderate' : 
                      salon.price_level === 3 ? 'Expensive' : 'Premium'})
                  </span>
                </div>
              )}
            </div>

            <div className="salon-card-actions">
              <button 
                onClick={() => onSalonSelect(salon)}
                className="view-details-btn"
              >
                View Details
              </button>
              
              <button 
                onClick={() => handleCall(salon.formatted_phone_number)}
                className="call-btn"
                disabled={!salon.formatted_phone_number}
              >
                📞 Call
              </button>
              
              <button 
                onClick={() => handleDirections(salon)}
                className="directions-btn"
              >
                🗺️ Directions
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredSalons.length === 0 && salons.length > 0 && (
        <div className="no-results">
          <h3>No salons match your filters</h3>
          <p>Try changing the filter options above</p>
        </div>
      )}
    </div>
  );
};

export default SalonList;
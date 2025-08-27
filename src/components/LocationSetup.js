// src/components/LocationSetup.js
import React, { useState } from 'react';
import './LocationSetup.css';

const LocationSetup = ({
  onLocationDetection,
  onLocationSearch,
  loading,
  loadingStatus,
  error
}) => {
  const [manualAddress, setManualAddress] = useState('');

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualAddress.trim()) {
      onLocationSearch(manualAddress.trim());
    }
  };

  const popularCities = [
    'New Delhi, India',
    'Mumbai, India',
    'Bangalore, India',
    'Chennai, India',
    'Kolkata, India',
    'Hyderabad, India',
    'Pune, India',
    'Ahmedabad, India'
  ];

  return (
    <div className="location-setup">
      <div className="location-setup-content">
        <div className="location-setup-header">
          <h1>Wanna style?</h1>
          <p>Just tell us your location</p>
        </div>

        {error && (
          <div className="error-message">
            <span>⚠️</span>
            <p>{error}</p>
          </div>
        )}

        <div className="location-options">
          {/* Auto-detect location */}
          <div className="location-option" onClick={!loading ? onLocationDetection : undefined}>
            <h3>📍 Use Current Location</h3>
            <p>Get accurate results instantly</p>
            {loading && (
              <div className="loading-indicator">
                <div className="spinner small"></div>
                <span>{loadingStatus || 'Getting location...'}</span>
              </div>
            )}
          </div>

          {/* Manual search */}
          <div className="location-option">
            <h3>🔍 Enter Location</h3>
            <form onSubmit={handleManualSubmit}>
              <input
                type="text"
                placeholder="City, area, or address"
                value={manualAddress}
                onChange={(e) => setManualAddress(e.target.value)}
                disabled={loading}
                className="address-input"
              />
            </form>
          </div>
        </div>

        {/* Popular cities */}
        <div className="popular-cities">
          <h4>Popular Cities</h4>
          <div className="city-buttons">
            {popularCities.map((city) => (
              <button
                key={city}
                onClick={() => onLocationSearch(city)}
                disabled={loading}
                className="city-btn"
              >
                {city.split(',')[0]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationSetup;
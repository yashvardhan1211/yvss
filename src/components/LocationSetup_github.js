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
          <h1>🗺️ Find Nearby Salons</h1>
          <p>Let's find real salons and beauty parlors near you</p>
        </div>

        {error && (
          <div className="error-message">
            <span>⚠️</span>
            <p>{error}</p>
          </div>
        )}

        <div className="location-options">
          {/* Auto-detect location */}
          <div className="location-option">
            <h3>📍 Use Your Current Location</h3>
            <p>Get the most accurate results based on where you are right now</p>
            <button 
              onClick={onLocationDetection}
              disabled={loading}
              className="primary-btn"
            >
              {loading ? (
                <>
                  <div className="spinner small"></div>
                  {loadingStatus || 'Getting location...'}
                </>
              ) : (
                'Use Current Location'
              )}
            </button>
            <small>You'll be asked to allow location access</small>
          </div>

          <div className="divider">
            <span>or</span>
          </div>

          {/* Manual search */}
          <div className="location-option">
            <h3>🔍 Search by Address</h3>
            <form onSubmit={handleManualSubmit}>
              <input
                type="text"
                placeholder="Enter city, area, or full address..."
                value={manualAddress}
                onChange={(e) => setManualAddress(e.target.value)}
                disabled={loading}
                className="address-input"
              />
              <button 
                type="submit" 
                disabled={loading || !manualAddress.trim()}
                className="secondary-btn"
              >
                {loading ? (
                  <>
                    <div className="spinner small"></div>
                    Searching...
                  </>
                ) : (
                  'Search Location'
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Popular cities */}
        <div className="popular-cities">
          <h4>Popular Cities:</h4>
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

        <div className="privacy-note">
          <p>🔒 Your location is only used to find nearby salons and is not stored or shared.</p>
        </div>
      </div>
    </div>
  );
};

export default LocationSetup;
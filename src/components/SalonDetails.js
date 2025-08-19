// src/components/SalonDetails.js
import React, { useState, useEffect } from 'react';
import './SalonDetails.css';

const SalonDetails = ({ salon, onBack, salonFinder }) => {
  const [detailedInfo, setDetailedInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      try {
        const details = await salonFinder.getPlaceDetails(salon.place_id);
        setDetailedInfo(details);
      } catch (error) {
        console.error('Failed to fetch detailed info:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [salon.place_id, salonFinder]);

  const handleCall = () => {
    const phone = detailedInfo?.formatted_phone_number || salon.formatted_phone_number;
    if (phone) {
      window.open(`tel:${phone.replace(/\s/g, '')}`, '_self');
    }
  };

  const handleDirections = () => {
    const { lat, lng } = salon.geometry.location;
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
  };

  const handleWebsite = () => {
    if (detailedInfo?.website) {
      window.open(detailedInfo.website, '_blank');
    }
  };

  const getOpeningHoursText = () => {
    if (!detailedInfo?.opening_hours?.weekday_text) {
      return salon.opening_hours?.open_now ? 'Currently Open' : 'Currently Closed';
    }
    return detailedInfo.opening_hours.weekday_text;
  };

  return (
    <div className="salon-details">
      <div className="salon-details-header">
        <button onClick={onBack} className="back-btn">
          ← Back to Results
        </button>
        
        <div className="salon-title">
          <h1>{salon.name}</h1>
          <div className="salon-subtitle">
            <span className="salon-type">{salon.type}</span>
            <div className={`status ${salon.opening_hours?.open_now ? 'open' : 'closed'}`}>
              {salon.opening_hours?.open_now === true ? '🟢 Open Now' : 
               salon.opening_hours?.open_now === false ? '🔴 Closed' : '🟡 Hours Unknown'}
            </div>
          </div>
        </div>

        <div className="quick-actions">
          <button 
            onClick={handleCall} 
            className="action-btn primary"
            disabled={!detailedInfo?.formatted_phone_number && !salon.formatted_phone_number}
          >
            📞 Call Now
          </button>
          <button onClick={handleDirections} className="action-btn secondary">
            🗺️ Get Directions
          </button>
          {detailedInfo?.website && (
            <button onClick={handleWebsite} className="action-btn secondary">
              🌐 Website
            </button>
          )}
        </div>
      </div>

      <div className="salon-details-tabs">
        <button 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab ${activeTab === 'reviews' ? 'active' : ''}`}
          onClick={() => setActiveTab('reviews')}
        >
          Reviews
        </button>
        <button 
          className={`tab ${activeTab === 'photos' ? 'active' : ''}`}
          onClick={() => setActiveTab('photos')}
        >
          Photos
        </button>
      </div>

      <div className="salon-details-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="overview-grid">
              <div className="info-section">
                <h3>📍 Location & Contact</h3>
                <div className="info-item">
                  <strong>Address:</strong>
                  <span>{salon.vicinity || salon.formatted_address}</span>
                </div>
                
                {loading ? (
                  <div className="loading-info">Loading contact details...</div>
                ) : (
                  <>
                    {detailedInfo?.formatted_phone_number && (
                      <div className="info-item">
                        <strong>Phone:</strong>
                        <span>{detailedInfo.formatted_phone_number}</span>
                      </div>
                    )}
                    
                    {detailedInfo?.website && (
                      <div className="info-item">
                        <strong>Website:</strong>
                        <a href={detailedInfo.website} target="_blank" rel="noopener noreferrer">
                          Visit Website
                        </a>
                      </div>
                    )}
                  </>
                )}

                <div className="info-item">
                  <strong>Distance:</strong>
                  <span>{salon.distance?.toFixed(1)} km away</span>
                </div>
              </div>

              <div className="info-section">
                <h3>⭐ Rating & Reviews</h3>
                <div className="rating-display">
                  <div className="stars-large">
                    {'★'.repeat(Math.floor(salon.rating || 0))}
                    {'☆'.repeat(5 - Math.floor(salon.rating || 0))}
                  </div>
                  <div className="rating-text">
                    <strong>{salon.rating?.toFixed(1) || 'No rating'}</strong>
                    <span>({salon.user_ratings_total || 0} reviews)</span>
                  </div>
                </div>

                {salon.price_level && (
                  <div className="price-info">
                    <strong>Price Level:</strong>
                    <span className="price-symbols">
                      {'₹'.repeat(salon.price_level)}
                      {'○'.repeat(4 - salon.price_level)}
                    </span>
                    <span>
                      ({salon.price_level === 1 ? 'Budget-friendly' : 
                        salon.price_level === 2 ? 'Moderate pricing' : 
                        salon.price_level === 3 ? 'Expensive' : 'Premium pricing'})
                    </span>
                  </div>
                )}
              </div>

              <div className="info-section">
                <h3>⏰ Queue & Timing</h3>
                <div className="queue-display">
                  <div className="queue-item">
                    <span className="queue-icon">👥</span>
                    <div>
                      <strong>{salon.queueLength}</strong>
                      <span>people in queue</span>
                    </div>
                  </div>
                  <div className="queue-item">
                    <span className="queue-icon">⏱️</span>
                    <div>
                      <strong>~{salon.waitTime} min</strong>
                      <span>estimated wait</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="info-section">
                <h3>✂️ Services Offered</h3>
                <div className="services-grid">
                  {salon.services?.map((service, index) => (
                    <div key={index} className="service-item">
                      {service}
                    </div>
                  ))}
                </div>
              </div>

              <div className="info-section full-width">
                <h3>🕐 Opening Hours</h3>
                {loading ? (
                  <div className="loading-info">Loading hours...</div>
                ) : (
                  <div className="opening-hours">
                    {typeof getOpeningHoursText() === 'string' ? (
                      <p>{getOpeningHoursText()}</p>
                    ) : (
                      <ul>
                        {getOpeningHoursText().map((hours, index) => (
                          <li key={index}>{hours}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="reviews-tab">
            {loading ? (
              <div className="loading-content">
                <div className="spinner"></div>
                <p>Loading reviews...</p>
              </div>
            ) : (
              <>
                {detailedInfo?.reviews && detailedInfo.reviews.length > 0 ? (
                  <div className="reviews-list">
                    {detailedInfo.reviews.map((review, index) => (
                      <div key={index} className="review-item">
                        <div className="review-header">
                          <div className="reviewer-info">
                            <img 
                              src={review.profile_photo_url} 
                              alt={review.author_name}
                              className="reviewer-photo"
                              onError={(e) => {
                                e.target.src = 'https://via.placeholder.com/40x40?text=' + 
                                  review.author_name.charAt(0);
                              }}
                            />
                            <div>
                              <strong>{review.author_name}</strong>
                              <div className="review-time">
                                {new Date(review.time * 1000).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          <div className="review-rating">
                            {'★'.repeat(review.rating)}
                            {'☆'.repeat(5 - review.rating)}
                          </div>
                        </div>
                        <p className="review-text">{review.text}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-reviews">
                    <h3>No reviews available</h3>
                    <p>This salon doesn't have any Google reviews yet.</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'photos' && (
          <div className="photos-tab">
            {salon.photos && salon.photos.length > 0 ? (
              <div className="photos-grid">
                {salon.photos.slice(0, 12).map((photo, index) => (
                  <img
                    key={index}
                    src={photo.getUrl({ maxWidth: 400, maxHeight: 300 })}
                    alt={`${salon.name} photo ${index + 1}`}
                    className="salon-photo"
                    onClick={() => window.open(photo.getUrl(), '_blank')}
                  />
                ))}
              </div>
            ) : (
              <div className="no-photos">
                <h3>No photos available</h3>
                <p>This salon doesn't have photos uploaded to Google.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SalonDetails;
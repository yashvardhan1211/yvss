// src/components/MapView.js
import React, { useEffect, useRef } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import './MapView.css';

const MapView = ({ salons, userLocation, locationName, onSalonSelect }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const infoWindowRef = useRef(null);

  useEffect(() => {
    const initializeMap = async () => {
      if (!userLocation || !mapRef.current) return;

      try {
        const loader = new Loader({
          apiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
          version: "weekly",
          libraries: ["places", "geometry"]
        });

        const google = await loader.load();

        // Create map
        const map = new google.maps.Map(mapRef.current, {
          center: { lat: userLocation.lat, lng: userLocation.lng },
          zoom: 14,
          styles: [
            {
              featureType: "poi.business",
              elementType: "labels",
              stylers: [{ visibility: "off" }]
            }
          ]
        });

        mapInstanceRef.current = map;

        // Create info window
        infoWindowRef.current = new google.maps.InfoWindow();

        // Add user location marker
        new google.maps.Marker({
          position: { lat: userLocation.lat, lng: userLocation.lng },
          map: map,
          title: "Your Location",
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                <circle cx="20" cy="20" r="18" fill="#4285f4" stroke="white" stroke-width="4"/>
                <circle cx="20" cy="20" r="8" fill="white"/>
              </svg>
            `),
            scaledSize: new google.maps.Size(40, 40),
            anchor: new google.maps.Point(20, 20)
          }
        });

        // Add salon markers
        addSalonMarkers(google, map);

      } catch (error) {
        console.error('Error initializing map:', error);
      }
    };

    initializeMap();

    return () => {
      // Cleanup markers
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
    };
  }, [userLocation]);

  useEffect(() => {
    if (mapInstanceRef.current && window.google) {
      addSalonMarkers(window.google, mapInstanceRef.current);
    }
  }, [salons]);

  const addSalonMarkers = (google, map) => {
    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Add new markers
    salons.forEach((salon) => {
      const marker = new google.maps.Marker({
        position: {
          lat: salon.geometry.location.lat,
          lng: salon.geometry.location.lng
        },
        map: map,
        title: salon.name,
        icon: {
          url: getSalonIcon(salon),
          scaledSize: new google.maps.Size(32, 32),
          anchor: new google.maps.Point(16, 32)
        }
      });

      // Add click listener
      marker.addListener('click', () => {
        const content = createInfoWindowContent(salon);
        infoWindowRef.current.setContent(content);
        infoWindowRef.current.open(map, marker);
      });

      markersRef.current.push(marker);
    });

    // Adjust map bounds to show all markers
    if (salons.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      bounds.extend({ lat: userLocation.lat, lng: userLocation.lng });
      
      salons.forEach(salon => {
        bounds.extend({
          lat: salon.geometry.location.lat,
          lng: salon.geometry.location.lng
        });
      });

      map.fitBounds(bounds);
      
      // Ensure minimum zoom level
      const listener = google.maps.event.addListener(map, 'idle', () => {
        if (map.getZoom() > 16) map.setZoom(16);
        google.maps.event.removeListener(listener);
      });
    }
  };

  const getSalonIcon = (salon) => {
    const color = salon.opening_hours?.open_now ? '#10B981' : // Green for open
                  salon.opening_hours?.open_now === false ? '#EF4444' : // Red for closed
                  '#F59E0B'; // Yellow for unknown

    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
      <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 2C10.48 2 6 6.48 6 12c0 7.5 10 18 10 18s10-10.5 10-18c0-5.52-4.48-10-10-10z" fill="${color}" stroke="white" stroke-width="2"/>
        <text x="16" y="14" text-anchor="middle" fill="white" font-size="12" font-weight="bold">✂</text>
      </svg>
    `)}`;
  };

  const createInfoWindowContent = (salon) => {
    return `
      <div class="info-window">
        <div class="info-header">
          <h4>${salon.name}</h4>
          <span class="salon-type">${salon.type}</span>
        </div>
        <div class="info-body">
          <div class="rating">
            ${'★'.repeat(Math.floor(salon.rating || 0))}${'☆'.repeat(5 - Math.floor(salon.rating || 0))}
            <span>${salon.rating?.toFixed(1) || 'N/A'} (${salon.user_ratings_total || 0})</span>
          </div>
          <div class="distance">${salon.distance?.toFixed(1)}km away</div>
          <div class="queue-info">
            <span>👥 ${salon.queueLength} in queue</span>
            <span>⏱️ ~${salon.waitTime}min wait</span>
          </div>
          <div class="status ${salon.opening_hours?.open_now ? 'open' : 'closed'}">
            ${salon.opening_hours?.open_now === true ? '🟢 Open Now' : 
              salon.opening_hours?.open_now === false ? '🔴 Closed' : '🟡 Hours Unknown'}
          </div>
        </div>
        <div class="info-actions">
          <button onclick="window.salonSelectHandler('${salon.place_id}')" class="details-btn">
            View Details
          </button>
        </div>
      </div>
    `;
  };

  // Expose salon select handler to global scope for info window buttons
  useEffect(() => {
    window.salonSelectHandler = (placeId) => {
      const salon = salons.find(s => s.place_id === placeId);
      if (salon && onSalonSelect) {
        onSalonSelect(salon);
      }
    };

    return () => {
      delete window.salonSelectHandler;
    };
  }, [salons, onSalonSelect]);

  if (!userLocation) {
    return (
      <div className="map-view placeholder">
        <div className="map-placeholder">
          <h3>🗺️ Map will appear here</h3>
          <p>Set your location to see nearby salons on the map</p>
        </div>
      </div>
    );
  }

  return (
    <div className="map-view">
      <div className="map-header">
        <h3>📍 Nearby Salons Map</h3>
        <p>{locationName}</p>
        <div className="map-legend">
          <div className="legend-item">
            <span className="legend-icon user">📍</span>
            <span>Your Location</span>
          </div>
          <div className="legend-item">
            <span className="legend-icon open">✂️</span>
            <span>Open Salons</span>
          </div>
          <div className="legend-item">
            <span className="legend-icon closed">✂️</span>
            <span>Closed/Unknown</span>
          </div>
        </div>
      </div>
      
      <div ref={mapRef} className="map-container" />
      
      <div className="map-stats">
        <div className="stat">
          <strong>{salons.length}</strong>
          <span>Salons Found</span>
        </div>
        <div className="stat">
          <strong>{salons.filter(s => s.opening_hours?.open_now).length}</strong>
          <span>Currently Open</span>
        </div>
        <div className="stat">
          <strong>3km</strong>
          <span>Search Radius</span>
        </div>
      </div>
    </div>
  );
};

export default MapView;
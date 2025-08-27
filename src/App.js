import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import './App.css';
import LocationSetup from './components/LocationSetup';
import OwnerLogin from './components/OwnerLogin';
import OwnerDashboard from './components/OwnerDashboard';
import SalonDetails from './components/SalonDetails';

// Customer App Component
function CustomerApp() {
  const [userLocation, setUserLocation] = useState(null);
  const [locationName, setLocationName] = useState('');
  const [salons, setSalons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [selectedSalon, setSelectedSalon] = useState(null);
  const [showSalonDetails, setShowSalonDetails] = useState(false);
  const [salonDetailsInitialTab, setSalonDetailsInitialTab] = useState('overview');

  // Initialize map when salons are loaded
  useEffect(() => {
    if (salons.length > 0 && userLocation) {
      initializeMap(salons, userLocation);
    }
  }, [salons, userLocation]);

  // Get user's current location
  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      console.log('🔍 Requesting location access...');
      
      const options = {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 300000
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('✅ Location obtained:', position.coords);
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          let message = 'Location access failed';
          switch(error.code) {
            case error.PERMISSION_DENIED:
              message = 'Location access denied by user';
              break;
            case error.POSITION_UNAVAILABLE:
              message = 'Location information unavailable';
              break;
            case error.TIMEOUT:
              message = 'Location request timed out';
              break;
            default:
              message = 'Unknown location error';
          }
          console.error('❌ Location error:', message);
          reject(new Error(message));
        },
        options
      );
    });
  };

  // Load Google Maps API with your key
  const loadGoogleMaps = () => {
    return new Promise((resolve, reject) => {
      if (window.google && window.google.maps && window.google.maps.places) {
        console.log('✅ Google Maps already loaded');
        resolve();
        return;
      }

      console.log('🔄 Loading Google Maps API...');
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&libraries=places&callback=initMap`;
      script.async = true;
      script.defer = true;
      
      // Add callback function to window
      window.initMap = () => {
        console.log('✅ Google Maps API loaded successfully');
        resolve();
      };
      
      script.onload = () => {
        // Fallback if callback doesn't work
        setTimeout(() => {
          if (window.google && window.google.maps) {
            console.log('✅ Google Maps loaded (fallback)');
            resolve();
          }
        }, 1000);
      };
      
      script.onerror = (error) => {
        console.error('❌ Failed to load Google Maps:', error);
        reject(new Error('Failed to load Google Maps API'));
      };
      
      document.head.appendChild(script);
    });
  };

  // Search for REAL nearby salons using Google Places API with your key
  const searchNearbyPlaces = async (location) => {
    console.log('🔍 Searching for REAL salons near:', location);
    
    try {
      // Load Google Maps API
      await loadGoogleMaps();
      
      // Wait for Google Maps to be fully available
      while (!window.google || !window.google.maps || !window.google.maps.places) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      console.log('✅ Google Maps loaded, starting Places API search...');
      
      // Create a map for PlacesService
      const mapDiv = document.createElement('div');
      const map = new window.google.maps.Map(mapDiv, {
        center: { lat: location.lat, lng: location.lng },
        zoom: 15
      });
      
      const service = new window.google.maps.places.PlacesService(map);
      let allResults = [];
      
      // Method 1: Text Search for salons
      console.log('🔍 Starting text search for salons...');
      const textSearchQueries = [
        'hair salon',
        'beauty salon', 
        'barber shop',
        'spa salon'
      ];
      
      for (const query of textSearchQueries) {
        try {
          console.log(`Searching for: ${query}`);
          const results = await new Promise((resolve, reject) => {
            const request = {
              query: query,
              location: new window.google.maps.LatLng(location.lat, location.lng),
              radius: 10000 // 10km radius
            };
            
            service.textSearch(request, (results, status) => {
              console.log(`${query} search status: ${status}`);
              console.log(`${query} results: ${results?.length || 0}`);
              
              if (status === window.google.maps.places.PlacesServiceStatus.OK) {
                resolve(results || []);
              } else if (status === window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
                resolve([]);
              } else if (status === window.google.maps.places.PlacesServiceStatus.REQUEST_DENIED) {
                console.error('❌ Places API request denied - check API key');
                reject(new Error('Places API request denied'));
              } else {
                console.warn(`${query} search failed: ${status}`);
                resolve([]);
              }
            });
          });
          
          if (results.length > 0) {
            console.log(`✅ Found ${results.length} results for "${query}"`);
            allResults = allResults.concat(results);
          }
          
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`Text search failed for "${query}":`, error);
        }
      }
      
      // Method 2: Nearby Search if text search didn't work well
      if (allResults.length < 5) {
        console.log('🔍 Adding nearby search results...');
        const nearbyTypes = ['beauty_salon', 'hair_care', 'spa'];
        
        for (const type of nearbyTypes) {
          try {
            console.log(`Nearby search for: ${type}`);
            const results = await new Promise((resolve, reject) => {
              const request = {
                location: new window.google.maps.LatLng(location.lat, location.lng),
                radius: 15000, // 15km radius
                type: type
              };
              
              service.nearbySearch(request, (results, status) => {
                console.log(`${type} nearby status: ${status}`);
                console.log(`${type} nearby results: ${results?.length || 0}`);
                
                if (status === window.google.maps.places.PlacesServiceStatus.OK) {
                  resolve(results || []);
                } else if (status === window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
                  resolve([]);
                } else {
                  console.warn(`${type} nearby search failed: ${status}`);
                  resolve([]);
                }
              });
            });
            
            if (results.length > 0) {
              console.log(`✅ Found ${results.length} nearby results for "${type}"`);
              allResults = allResults.concat(results);
            }
            
            await new Promise(resolve => setTimeout(resolve, 100));
          } catch (error) {
            console.error(`Nearby search failed for "${type}":`, error);
          }
        }
      }
      
      // Remove duplicates based on place_id
      const uniqueResults = allResults.filter((place, index, self) => 
        index === self.findIndex(p => p.place_id === place.place_id)
      );
      
      console.log(`✅ Total unique results: ${uniqueResults.length}`);
      
      if (uniqueResults.length === 0) {
        throw new Error('No salons found in your area. Try a different location.');
      }
      
      // Process and format results
      const processedSalons = uniqueResults.map(place => {
        const distance = calculateDistance(
          location.lat,
          location.lng,
          place.geometry.location.lat(),
          place.geometry.location.lng()
        );
        
        return {
          place_id: place.place_id,
          name: place.name,
          type: determineSalonType(place),
          vicinity: place.vicinity || place.formatted_address,
          formatted_address: place.formatted_address || place.vicinity,
          geometry: {
            location: {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng()
            }
          },
          rating: place.rating || 4.0,
          user_ratings_total: place.user_ratings_total || Math.floor(Math.random() * 50) + 10,
          price_level: place.price_level || 2,
          opening_hours: place.opening_hours,
          photos: place.photos,
          types: place.types,
          distance: distance,
          queueLength: Math.floor(Math.random() * 8) + 1,
          waitTime: Math.floor(Math.random() * 35) + 10,
          services: generateServices(determineSalonType(place))
        };
      })
      .sort((a, b) => a.distance - b.distance) // Sort by distance
      .slice(0, 15); // Limit to 15 results
      
      console.log(`✅ Returning ${processedSalons.length} processed REAL salons`);
      return processedSalons;
      
    } catch (error) {
      console.error('❌ Places API search completely failed:', error);
      throw new Error(`Failed to find salons: ${error.message}`);
    }
  };

  // Calculate distance between two points
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Determine salon type from place data
  const determineSalonType = (place) => {
    const name = place.name.toLowerCase();
    const types = place.types || [];

    if (types.includes('hair_care') || name.includes('barber')) {
      return 'Barber Shop';
    } else if (types.includes('spa') || name.includes('spa')) {
      return 'Spa & Salon';
    } else if (name.includes('unisex')) {
      return 'Unisex Salon';
    } else if (name.includes('ladies') || name.includes('women')) {
      return 'Ladies Salon';
    } else if (name.includes('gents') || name.includes('men')) {
      return 'Gents Salon';
    } else if (name.includes('parlor') || name.includes('parlour')) {
      return 'Beauty Parlour';
    }
    return 'Beauty Salon';
  };

  // Generate services based on salon type
  const generateServices = (salonType) => {
    const servicesByType = {
      'Barber Shop': ['Haircut', 'Beard Trim', 'Shaving', 'Head Massage'],
      'Beauty Salon': ['Haircut', 'Hair Styling', 'Facial', 'Waxing', 'Threading'],
      'Beauty Parlour': ['Facial', 'Waxing', 'Threading', 'Manicure', 'Pedicure'],
      'Spa & Salon': ['Haircut', 'Facial', 'Massage', 'Spa Treatment'],
      'Unisex Salon': ['Haircut', 'Hair Styling', 'Facial', 'Threading'],
      'Ladies Salon': ['Haircut', 'Hair Styling', 'Facial', 'Waxing'],
      'Gents Salon': ['Haircut', 'Beard Styling', 'Hair Wash', 'Facial']
    };
    return servicesByType[salonType] || ['Haircut', 'Hair Styling'];
  };

  // Initialize map with salons
  const initializeMap = async (salons, userLocation) => {
    try {
      // Load Google Maps if not loaded
      await loadGoogleMaps();
      
      // Wait for Google Maps to be fully available
      while (!window.google || !window.google.maps) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      const mapElement = document.getElementById('salon-map');
      if (!mapElement) return;
      
      // Create map centered on user location
      const map = new window.google.maps.Map(mapElement, {
        center: { lat: userLocation.lat, lng: userLocation.lng },
        zoom: 14,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });
      
      // Add user location marker
      new window.google.maps.Marker({
        position: { lat: userLocation.lat, lng: userLocation.lng },
        map: map,
        title: 'Your Location',
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="8" fill="#4285F4" stroke="white" stroke-width="2"/>
              <circle cx="12" cy="12" r="3" fill="white"/>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(24, 24),
          anchor: new window.google.maps.Point(12, 12)
        }
      });
      
      // Add salon markers
      salons.forEach((salon, index) => {
        const marker = new window.google.maps.Marker({
          position: { 
            lat: salon.geometry.location.lat, 
            lng: salon.geometry.location.lng 
          },
          map: map,
          title: salon.name,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 2C10.48 2 6 6.48 6 12C6 20 16 30 16 30S26 20 26 12C26 6.48 21.52 2 16 2Z" fill="#E74C3C" stroke="white" stroke-width="2"/>
                <circle cx="16" cy="12" r="4" fill="white"/>
                <text x="16" y="16" text-anchor="middle" fill="#E74C3C" font-size="10" font-weight="bold">${index + 1}</text>
              </svg>
            `),
            scaledSize: new window.google.maps.Size(32, 32),
            anchor: new window.google.maps.Point(16, 32)
          }
        });
        
        // Add info window
        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 10px; max-width: 250px;">
              <h3 style="margin: 0 0 5px 0; color: #333;">${salon.name}</h3>
              <p style="margin: 0 0 5px 0; color: #666; font-size: 14px;">${salon.type}</p>
              <p style="margin: 0 0 5px 0; color: #666; font-size: 12px;">${salon.vicinity}</p>
              <div style="margin: 5px 0;">
                <span style="color: #f39c12;">⭐ ${salon.rating}</span>
                <span style="color: #3498db; margin-left: 10px;">📍 ${salon.distance < 1 ? 
                  `${Math.round(salon.distance * 1000)}m` : 
                  `${salon.distance.toFixed(1)}km`
                }</span>
              </div>
              <div style="margin: 5px 0; font-size: 12px;">
                ${salon.opening_hours?.open_now ? '🟢 Open' : '🔴 Closed'}
                <span style="margin-left: 10px;">👥 ${salon.queueLength} people</span>
              </div>
            </div>
          `
        });
        
        marker.addListener('click', () => {
          infoWindow.open(map, marker);
        });
      });
      
      // Adjust map bounds to show all markers
      if (salons.length > 0) {
        const bounds = new window.google.maps.LatLngBounds();
        bounds.extend({ lat: userLocation.lat, lng: userLocation.lng });
        salons.forEach(salon => {
          bounds.extend({ 
            lat: salon.geometry.location.lat, 
            lng: salon.geometry.location.lng 
          });
        });
        map.fitBounds(bounds);
        
        // Ensure minimum zoom level
        const listener = window.google.maps.event.addListener(map, 'idle', () => {
          if (map.getZoom() > 16) map.setZoom(16);
          window.google.maps.event.removeListener(listener);
        });
      }
      
    } catch (error) {
      console.error('Failed to initialize map:', error);
    }
  };

  // Handle location detection
  const handleLocationDetection = async () => {
    setLoading(true);
    setError(null);
    
    try {
      setLoadingStatus('Getting your location...');
      const location = await getCurrentLocation();
      console.log('📍 Location obtained:', location);
      
      setLoadingStatus('Finding address...');
      const address = `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;
      
      setUserLocation(location);
      setLocationName(address);
      
      setLoadingStatus('Searching for nearby salons...');
      
      const results = await searchNearbyPlaces(location);
      
      if (results && results.length > 0) {
        setSalons(results);
        console.log(`✅ Successfully loaded ${results.length} salons`);
        setLoadingStatus('');
      } else {
        throw new Error('No salons found in your area. Try a different location.');
      }
      
    } catch (error) {
      console.error('❌ Location detection failed:', error);
      setError(error.message);
      setLoadingStatus('');
    } finally {
      setLoading(false);
    }
  };

  // Geocode address to coordinates
  const geocodeAddress = async (address) => {
    try {
      // Load Google Maps if not loaded
      await loadGoogleMaps();
      
      // Wait for Google Maps to be fully available
      while (!window.google || !window.google.maps) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      const geocoder = new window.google.maps.Geocoder();
      
      return new Promise((resolve, reject) => {
        geocoder.geocode({ address: address }, (results, status) => {
          console.log('Geocoding status:', status);
          console.log('Geocoding results:', results);
          
          if (status === 'OK' && results[0]) {
            const location = results[0].geometry.location;
            resolve({
              lat: location.lat(),
              lng: location.lng(),
              formatted_address: results[0].formatted_address
            });
          } else if (status === 'ZERO_RESULTS') {
            reject(new Error('Location not found. Please try a different address.'));
          } else if (status === 'REQUEST_DENIED') {
            reject(new Error('Geocoding request denied. Please check your API key.'));
          } else {
            reject(new Error('Failed to find location. Please try again.'));
          }
        });
      });
    } catch (error) {
      throw new Error('Geocoding failed: ' + error.message);
    }
  };

  // Handle manual location search
  const handleLocationSearch = async (address) => {
    setLoading(true);
    setError(null);
    
    try {
      setLoadingStatus('Finding location...');
      const result = await geocodeAddress(address);
      console.log('📍 Geocoded location:', result);
      
      setUserLocation({ lat: result.lat, lng: result.lng });
      setLocationName(result.formatted_address);
      
      setLoadingStatus('Searching for nearby salons...');
      
      const results = await searchNearbyPlaces({ lat: result.lat, lng: result.lng });
      
      if (results && results.length > 0) {
        setSalons(results);
        console.log(`✅ Successfully loaded ${results.length} salons`);
        setLoadingStatus('');
      } else {
        throw new Error('No salons found in this area. Try a different location.');
      }
      
    } catch (error) {
      console.error('❌ Location search failed:', error);
      setError(error.message);
      setLoadingStatus('');
    } finally {
      setLoading(false);
    }
  };

  // Render location setup if no location
  if (!userLocation) {
    return (
      <div>
        <div className="app-nav">
          <Link to="/owner" className="owner-link">
            💼 Salon Owner? Manage Your Queue →
          </Link>
        </div>
        <LocationSetup 
          onLocationDetection={handleLocationDetection}
          onLocationSearch={handleLocationSearch}
          loading={loading}
          loadingStatus={loadingStatus}
          error={error}
        />
      </div>
    );
  }

  // Main app view with salons
  return (
    <div className="app">
      <header className="app-header">
        <h1>🗺️ Real Salon Finder</h1>
        <p>📍 {locationName}</p>
        <div className="header-actions">
          <button 
            onClick={() => setUserLocation(null)}
            className="change-location-btn"
          >
            Change Location
          </button>
          <Link to="/owner" className="owner-link-header">
            💼 Owner Dashboard
          </Link>
        </div>
      </header>

      <main className="app-main">
        {loading && (
          <div className="search-loading">
            <div className="spinner"></div>
            <p>{loadingStatus}</p>
          </div>
        )}

        <div className="main-content">
          <div className="salon-list">
            <h2>Nearby Salons ({salons.length})</h2>
            {salons.map(salon => (
              <div key={salon.place_id} className="salon-card">
                <div className="salon-card-content">
                  <div className="salon-main-info">
                    <h3>{salon.name}</h3>
                    <p className="salon-type">{salon.type}</p>
                    <p className="salon-address">{salon.vicinity}</p>
                    <div className="salon-rating">
                      ⭐ {salon.rating} ({salon.user_ratings_total} reviews)
                    </div>
                    <div className="salon-distance">
                      📍 {salon.distance < 1 ? 
                        `${Math.round(salon.distance * 1000)}m away` : 
                        `${salon.distance.toFixed(1)}km away`
                      }
                    </div>
                    <div className="salon-status">
                      {salon.opening_hours?.open_now ? '🟢 Open' : '🔴 Closed'}
                    </div>
                    <div className="salon-services">
                      Services: {salon.services.join(', ')}
                    </div>
                  </div>
                  
                  <div className="salon-actions">
                    <div className={`queue-status ${salon.queueLength <= 3 ? 'low' : salon.queueLength >= 6 ? 'high' : ''}`}>
                      {salon.queueLength} in queue
                    </div>
                    <button 
                      className="book-now-btn"
                      onClick={() => {
                        setSelectedSalon(salon);
                        setSalonDetailsInitialTab('quickActions');
                        setShowSalonDetails(true);
                      }}
                    >
                      Quick Actions
                    </button>
                    <button 
                      className="more-details-btn"
                      onClick={() => {
                        setSelectedSalon(salon);
                        setSalonDetailsInitialTab('overview');
                        setShowSalonDetails(true);
                      }}
                    >
                      More Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="map-container">
            <div id="salon-map" className="salon-map"></div>
          </div>
        </div>

        {/* Salon Details Modal */}
        {showSalonDetails && selectedSalon && (
          <SalonDetails
            salon={selectedSalon}
            initialTab={salonDetailsInitialTab}
            onClose={() => {
              setShowSalonDetails(false);
              setSelectedSalon(null);
              setSalonDetailsInitialTab('overview');
            }}
            onBookingComplete={(bookingData) => {
              console.log('Booking completed:', bookingData);
              // You can add additional logic here like updating the salon queue
            }}
          />
        )}
      </main>
    </div>
  );
}

// Owner Portal Component
function OwnerPortal() {
  const [ownerData, setOwnerData] = useState(null);

  const handleLogin = (data) => {
    setOwnerData(data);
  };

  const handleLogout = () => {
    setOwnerData(null);
  };

  if (!ownerData) {
    return <OwnerLogin onLogin={handleLogin} />;
  }

  return <OwnerDashboard ownerData={ownerData} onLogout={handleLogout} />;
}

// Main App with Routing
function App() {
  // Only use basename for GitHub Pages, not for localhost or Vercel
  const basename = process.env.NODE_ENV === 'production' && window.location.hostname === 'yashvardhan1211.github.io' ? '/yvss' : '';
  
  return (
    <Router basename={basename}>
      <div>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/" element={<CustomerApp />} />
          <Route path="/owner" element={<OwnerPortal />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
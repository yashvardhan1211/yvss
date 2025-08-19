// src/App.js
import React, { useState, useEffect } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import './App.css';

// Import your components (we'll create these files)
import LocationSetup from './components/LocationSetup';
import SalonList from './components/SalonList';
import SalonDetails from './components/SalonDetails';
import MapView from './components/MapView';

// Google Maps API configuration
const GOOGLE_MAPS_CONFIG = {
  apiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
  version: "weekly",
  libraries: ["places", "geometry"]
};

class RealSalonFinder {
  constructor() {
    this.loader = new Loader(GOOGLE_MAPS_CONFIG);
    this.placesService = null;
    this.geocoder = null;
    this.map = null;
  }

  // Initialize Google Maps services
  async initialize() {
    try {
      this.google = await this.loader.load();
      
      // Create a hidden map for PlacesService
      const mapDiv = document.createElement('div');
      this.map = new this.google.maps.Map(mapDiv);
      
      this.placesService = new this.google.maps.places.PlacesService(this.map);
      this.geocoder = new this.google.maps.Geocoder();
      
      return true;
    } catch (error) {
      console.error('Failed to load Google Maps:', error);
      throw error;
    }
  }

  // Get user's current location
  getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      const options = {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 300000 // 5 minutes
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
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
          reject(new Error(message));
        },
        options
      );
    });
  }

  // Convert address to coordinates
  async geocodeAddress(address) {
    return new Promise((resolve, reject) => {
      this.geocoder.geocode({ address }, (results, status) => {
        if (status === this.google.maps.GeocoderStatus.OK && results[0]) {
          const location = results[0].geometry.location;
          resolve({
            lat: location.lat(),
            lng: location.lng(),
            formatted_address: results[0].formatted_address
          });
        } else {
          reject(new Error('Address not found'));
        }
      });
    });
  }

  // Get location name from coordinates
  async reverseGeocode(lat, lng) {
    return new Promise((resolve) => {
      this.geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === this.google.maps.GeocoderStatus.OK && results[0]) {
          resolve(results[0].formatted_address);
        } else {
          resolve(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        }
      });
    });
  }

  // Search for nearby salons
  async searchNearbyPlaces(location, radius = 5000) {
    console.log('Starting salon search at location:', location);
    
    try {
      // Start with a simple, broad search
      console.log('Searching for beauty salons...');
      const results = await this.performSearch({
        location: new this.google.maps.LatLng(location.lat, location.lng),
        radius: radius,
        type: ['beauty_salon']
      });

      console.log(`Found ${results.length} beauty salons`);

      // If no beauty salons, try hair care
      if (results.length === 0) {
        console.log('No beauty salons found, trying hair care...');
        const hairResults = await this.performSearch({
          location: new this.google.maps.LatLng(location.lat, location.lng),
          radius: radius,
          type: ['hair_care']
        });
        results.push(...hairResults);
        console.log(`Found ${hairResults.length} hair care places`);
      }

      // If still no results, try a keyword search
      if (results.length === 0) {
        console.log('No type results, trying keyword search...');
        const keywordResults = await this.performSearch({
          location: new this.google.maps.LatLng(location.lat, location.lng),
          radius: radius,
          keyword: 'salon'
        });
        results.push(...keywordResults);
        console.log(`Found ${keywordResults.length} places with keyword salon`);
      }

      // If still no results, try establishments with broader radius
      if (results.length === 0) {
        console.log('Trying broader search with 10km radius...');
        const broadResults = await this.performSearch({
          location: new this.google.maps.LatLng(location.lat, location.lng),
          radius: 10000,
          keyword: 'beauty salon'
        });
        results.push(...broadResults);
        console.log(`Found ${broadResults.length} places in broader search`);
      }

      console.log(`Total places found: ${results.length}`);

      // Process and enhance results
      return this.processPlaceResults(results, location);
    } catch (error) {
      console.error('Error in searchNearbyPlaces:', error);
      throw error;
    }
  }

  // Perform individual place search
  performSearch(request) {
    return new Promise((resolve, reject) => {
      console.log('Performing search with request:', request);
      
      // Add timeout for individual searches
      const timeoutId = setTimeout(() => {
        console.log('Search request timed out');
        resolve([]);
      }, 10000);
      
      this.placesService.nearbySearch(request, (results, status) => {
        clearTimeout(timeoutId);
        console.log('Search completed with status:', status, 'Results:', results?.length || 0);
        
        if (status === this.google.maps.places.PlacesServiceStatus.OK) {
          resolve(results || []);
        } else if (status === this.google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
          console.log('No results found for this search');
          resolve([]);
        } else if (status === this.google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT) {
          console.warn('Query limit exceeded');
          reject(new Error('Too many requests. Please try again in a moment.'));
        } else if (status === this.google.maps.places.PlacesServiceStatus.REQUEST_DENIED) {
          console.warn('Request denied - check API key and permissions');
          reject(new Error('API request denied. Please check your Google Maps API key and ensure Places API is enabled.'));
        } else {
          console.warn('Search failed with status:', status);
          resolve([]);
        }
      });
    });
  }

  // Process and enhance place results
  processPlaceResults(places, userLocation) {
    return places.map(place => {
      const distance = this.calculateDistance(
        userLocation.lat,
        userLocation.lng,
        place.geometry.location.lat(),
        place.geometry.location.lng()
      );

      // Determine salon type
      let salonType = this.determineSalonType(place);

      // Generate services based on type
      const services = this.generateServices(salonType);

      return {
        place_id: place.place_id,
        name: place.name,
        type: salonType,
        vicinity: place.vicinity,
        formatted_address: place.formatted_address || place.vicinity,
        geometry: {
          location: {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng()
          }
        },
        rating: place.rating,
        user_ratings_total: place.user_ratings_total,
        price_level: place.price_level,
        opening_hours: place.opening_hours,
        photos: place.photos,
        types: place.types,
        distance: distance,
        // Generate realistic queue data
        queueLength: Math.floor(Math.random() * 8) + 1,
        waitTime: Math.floor(Math.random() * 35) + 10,
        services: services
      };
    }).sort((a, b) => a.distance - b.distance);
  }

  // Calculate distance between two points
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // Determine salon type from place data
  determineSalonType(place) {
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
  }

  // Generate services based on salon type
  generateServices(salonType) {
    const servicesByType = {
      'Barber Shop': ['Haircut', 'Beard Trim', 'Shaving', 'Head Massage', 'Hair Wash'],
      'Beauty Salon': ['Haircut', 'Hair Styling', 'Facial', 'Waxing', 'Threading', 'Manicure'],
      'Beauty Parlour': ['Facial', 'Waxing', 'Threading', 'Manicure', 'Pedicure', 'Bridal Makeup'],
      'Spa & Salon': ['Haircut', 'Facial', 'Massage', 'Spa Treatment', 'Hair Treatment'],
      'Unisex Salon': ['Haircut', 'Hair Styling', 'Facial', 'Threading', 'Hair Wash'],
      'Ladies Salon': ['Haircut', 'Hair Styling', 'Facial', 'Waxing', 'Bridal Services'],
      'Gents Salon': ['Haircut', 'Beard Styling', 'Hair Wash', 'Facial', 'Head Massage']
    };
    return servicesByType[salonType] || ['Haircut', 'Hair Styling', 'Hair Wash'];
  }

  // Get detailed place information
  async getPlaceDetails(placeId) {
    return new Promise((resolve) => {
      const request = {
        placeId: placeId,
        fields: [
          'formatted_phone_number', 
          'website', 
          'opening_hours', 
          'reviews',
          'photos'
        ]
      };

      this.placesService.getDetails(request, (place, status) => {
        if (status === this.google.maps.places.PlacesServiceStatus.OK) {
          resolve(place);
        } else {
          resolve(null);
        }
      });
    });
  }
}

// Main App Component
function App() {
  const [salonFinder] = useState(() => new RealSalonFinder());
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locationName, setLocationName] = useState('');
  const [salons, setSalons] = useState([]);
  const [selectedSalon, setSelectedSalon] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState('');

  // Initialize Google Maps on app start
  useEffect(() => {
    const initializeApp = async () => {
      try {
        setLoadingStatus('Loading Google Maps...');
        await salonFinder.initialize();
        setInitialized(true);
      } catch (error) {
        setError('Failed to initialize Google Maps: ' + error.message);
      }
    };

    if (GOOGLE_MAPS_CONFIG.apiKey) {
      initializeApp();
    } else {
      setError('Google Maps API key not found. Please add REACT_APP_GOOGLE_MAPS_API_KEY to your .env file');
    }
  }, [salonFinder]);

  // Handle location detection
  const handleLocationDetection = async () => {
    setLoading(true);
    setError(null);
    
    try {
      setLoadingStatus('Getting your location...');
      const location = await salonFinder.getCurrentLocation();
      
      setLoadingStatus('Finding address...');
      const address = await salonFinder.reverseGeocode(location.lat, location.lng);
      
      setUserLocation(location);
      setLocationName(address);
      
      await searchForSalons(location);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle manual location search
  const handleLocationSearch = async (address) => {
    setLoading(true);
    setError(null);
    
    try {
      setLoadingStatus('Finding location...');
      const result = await salonFinder.geocodeAddress(address);
      
      setUserLocation({ lat: result.lat, lng: result.lng });
      setLocationName(result.formatted_address);
      
      await searchForSalons({ lat: result.lat, lng: result.lng });
    } catch (error) {
      setError('Location not found: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Search for salons near location
  const searchForSalons = async (location) => {
    try {
      setLoadingStatus('Searching for nearby salons...');
      
      // Add timeout to prevent infinite loading
      const searchPromise = salonFinder.searchNearbyPlaces(location);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Search timeout - please try again')), 20000)
      );
      
      const results = await Promise.race([searchPromise, timeoutPromise]);
      setSalons(results);
      
      if (results.length === 0) {
        // If no results, show mock data as fallback
        console.log('No real results found, showing mock data');
        const mockSalons = generateMockSalons(location);
        setSalons(mockSalons);
        setError('Using sample data - Google Places API may not be working properly');
      }
    } catch (error) {
      console.error('Search error:', error);
      
      // Show mock data on error
      const mockSalons = generateMockSalons(location);
      setSalons(mockSalons);
      setError('API Error: ' + error.message + ' - Showing sample data');
    }
  };

  // Generate mock salon data for testing
  const generateMockSalons = (location) => {
    return [
      {
        place_id: 'mock_1',
        name: 'Glamour Beauty Salon',
        type: 'Beauty Salon',
        vicinity: 'Near your location',
        formatted_address: 'Sample Address 1',
        geometry: {
          location: {
            lat: location.lat + 0.001,
            lng: location.lng + 0.001
          }
        },
        rating: 4.5,
        user_ratings_total: 120,
        price_level: 2,
        distance: 0.2,
        queueLength: 3,
        waitTime: 15,
        services: ['Haircut', 'Hair Styling', 'Facial', 'Waxing']
      },
      {
        place_id: 'mock_2',
        name: 'Style Studio',
        type: 'Unisex Salon',
        vicinity: 'Near your location',
        formatted_address: 'Sample Address 2',
        geometry: {
          location: {
            lat: location.lat - 0.002,
            lng: location.lng + 0.002
          }
        },
        rating: 4.2,
        user_ratings_total: 85,
        price_level: 3,
        distance: 0.5,
        queueLength: 5,
        waitTime: 25,
        services: ['Haircut', 'Hair Styling', 'Threading', 'Hair Wash']
      },
      {
        place_id: 'mock_3',
        name: 'Gents Barber Shop',
        type: 'Barber Shop',
        vicinity: 'Near your location',
        formatted_address: 'Sample Address 3',
        geometry: {
          location: {
            lat: location.lat + 0.003,
            lng: location.lng - 0.001
          }
        },
        rating: 4.7,
        user_ratings_total: 200,
        price_level: 1,
        distance: 0.8,
        queueLength: 2,
        waitTime: 10,
        services: ['Haircut', 'Beard Trim', 'Shaving', 'Head Massage']
      }
    ];
  };

  // Handle salon selection
  const handleSalonSelect = async (salon) => {
    setSelectedSalon(salon);
    
    // Fetch additional details
    try {
      const details = await salonFinder.getPlaceDetails(salon.place_id);
      if (details) {
        setSelectedSalon(prev => ({
          ...prev,
          formatted_phone_number: details.formatted_phone_number,
          website: details.website,
          reviews: details.reviews,
          detailed_opening_hours: details.opening_hours
        }));
      }
    } catch (error) {
      console.error('Failed to fetch place details:', error);
    }
  };

  // Render loading state
  if (!initialized && !error) {
    return (
      <div className="app-loading">
        <div className="loading-content">
          <div className="spinner"></div>
          <h2>Initializing Salon Finder</h2>
          <p>{loadingStatus}</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error && !userLocation) {
    return (
      <div className="app-error">
        <div className="error-content">
          <h2>Error</h2>
          <p>{error}</p>
          {!GOOGLE_MAPS_CONFIG.apiKey && (
            <div className="api-key-help">
              <h3>To fix this:</h3>
              <ol>
                <li>Get a Google Maps API key from Google Cloud Console</li>
                <li>Create a <code>.env</code> file in your project root</li>
                <li>Add: <code>REACT_APP_GOOGLE_MAPS_API_KEY=your_key_here</code></li>
                <li>Restart your development server</li>
              </ol>
            </div>
          )}
          <button onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Render location setup
  if (!userLocation) {
    return (
      <LocationSetup 
        onLocationDetection={handleLocationDetection}
        onLocationSearch={handleLocationSearch}
        loading={loading}
        loadingStatus={loadingStatus}
        error={error}
      />
    );
  }

  // Main app view
  return (
    <div className="app">
      <header className="app-header">
        <h1>🗺️ Real Salon Finder</h1>
        <p>📍 {locationName}</p>
        <button 
          onClick={() => setUserLocation(null)}
          className="change-location-btn"
        >
          Change Location
        </button>
      </header>

      <main className="app-main">
        {loading && (
          <div className="search-loading">
            <div className="spinner"></div>
            <p>{loadingStatus}</p>
          </div>
        )}

        {selectedSalon ? (
          <SalonDetails 
            salon={selectedSalon}
            onBack={() => setSelectedSalon(null)}
            salonFinder={salonFinder}
          />
        ) : (
          <div className="main-content">
            <div className="salon-list-container">
              <SalonList 
                salons={salons}
                onSalonSelect={handleSalonSelect}
                loading={loading}
                error={error}
              />
            </div>
            
            <div className="map-container">
              <MapView 
                salons={salons}
                userLocation={userLocation}
                locationName={locationName}
                onSalonSelect={handleSalonSelect}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;





import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import './App.css';
import LocationSetup from './components/LocationSetup';
import OwnerLogin from './components/OwnerLogin';
import OwnerDashboard from './components/OwnerDashboard';
import SalonDetails from './components/SalonDetails';
import JoinQueuePage from './components/JoinQueuePage';
import BookAppointmentPage from './components/BookAppointmentPage';
import MoreInfoPage from './components/MoreInfoPage';
import QueueModal from './components/QueueModal';
import BookingUpdatesModal from './components/BookingUpdatesModal';
import { useRealTimeQueue } from './hooks/useRealTimeQueue';
import toast from 'react-hot-toast';
import websocketService from './services/websocketService';
import ConnectionStatus from './components/ConnectionStatus';

// Customer App Component
function CustomerApp() {
  const [userLocation, setUserLocation] = useState(null);
  const [locationName, setLocationName] = useState('');
  const [salons, setSalons] = useState([]);
  const [filteredSalons, setFilteredSalons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [selectedSalon, setSelectedSalon] = useState(null);
  const [showSalonDetails, setShowSalonDetails] = useState(false);
  const [salonDetailsInitialTab, setSalonDetailsInitialTab] = useState('overview');
  
  // Queue Modal state
  const [showQueueModal, setShowQueueModal] = useState(false);
  const [queueSalon, setQueueSalon] = useState(null);
  
  // New state for filtering and sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('distance');
  const [filterByService, setFilterByService] = useState('all');
  const [filterByRating, setFilterByRating] = useState('all');
  const [filterByPrice, setFilterByPrice] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // Bookings state
  const [userBookings, setUserBookings] = useState([]);
  const [showBookings, setShowBookings] = useState(false);
  
  // Real-time booking updates state
  const [currentBooking, setCurrentBooking] = useState(null);
  const [showBookingUpdates, setShowBookingUpdates] = useState(false);
  
  // Mobile salon view state
  const [showJoinQueuePage, setShowJoinQueuePage] = useState(false);
  const [showBookAppointmentPage, setShowBookAppointmentPage] = useState(false);
  const [showMoreInfoPage, setShowMoreInfoPage] = useState(false);
  const [selectedSalonForPage, setSelectedSalonForPage] = useState(null);

  // Map removed for cleaner design

  // Filter and sort salons when criteria change
  useEffect(() => {
    let filtered = [...salons];

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(salon =>
        salon.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        salon.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        salon.vicinity.toLowerCase().includes(searchQuery.toLowerCase()) ||
        salon.services.some(service => 
          service.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    // Apply service filter
    if (filterByService !== 'all') {
      filtered = filtered.filter(salon =>
        salon.services.some(service =>
          service.toLowerCase().includes(filterByService.toLowerCase())
        )
      );
    }

    // Apply rating filter
    if (filterByRating !== 'all') {
      const minRating = parseFloat(filterByRating);
      filtered = filtered.filter(salon => salon.rating >= minRating);
    }

    // Apply price filter
    if (filterByPrice !== 'all') {
      const priceLevel = parseInt(filterByPrice);
      filtered = filtered.filter(salon => salon.price_level === priceLevel);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'distance':
          return a.distance - b.distance;
        case 'rating':
          return b.rating - a.rating;
        case 'price_low':
          return (a.price_level || 2) - (b.price_level || 2);
        case 'price_high':
          return (b.price_level || 2) - (a.price_level || 2);
        case 'queue':
          return a.queueLength - b.queueLength;
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    setFilteredSalons(filtered);
  }, [salons, searchQuery, sortBy, filterByService, filterByRating, filterByPrice]);

  // Get user's current location
  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      console.log('Requesting location access...');
      
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

  // HARD SEARCH: Aggressive multi-strategy salon discovery
  const searchNearbyPlaces = async (location) => {
    console.log('HARD SEARCH: Starting aggressive salon discovery near:', location);
    console.log('Location data received:', {
      lat: location.lat,
      lng: location.lng,
      address: location.address
    });
    
    try {
      // Load Google Maps API with timeout
      console.log('🔄 Loading Google Maps API...');
      await loadGoogleMaps();
      
      // Wait for Google Maps to be fully available with timeout
      let attempts = 0;
      const maxAttempts = 100; // 10 seconds timeout
      
      while ((!window.google || !window.google.maps || !window.google.maps.places) && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
      
      if (!window.google || !window.google.maps || !window.google.maps.places) {
        throw new Error('Google Maps API failed to load. Check your API key and internet connection.');
      }
      
      console.log('✅ Google Maps loaded, starting HARD SEARCH...');
      
      // Create a map for PlacesService
      const mapDiv = document.createElement('div');
      const map = new window.google.maps.Map(mapDiv, {
        center: { lat: location.lat, lng: location.lng },
        zoom: 15
      });
      
      const service = new window.google.maps.places.PlacesService(map);
      
      // Test API key with a simple request first
      console.log('🔑 Testing Google Places API key...');
      try {
        await new Promise((resolve, reject) => {
          service.nearbySearch({
            location: new window.google.maps.LatLng(location.lat, location.lng),
            radius: 1000,
            type: 'establishment'
          }, (results, status) => {
            console.log('🔑 API Key Test Status:', status);
            if (status === window.google.maps.places.PlacesServiceStatus.REQUEST_DENIED) {
              reject(new Error('❌ Google Places API key is INVALID or RESTRICTED. Check your .env file and Google Console API key settings.'));
            } else if (status === window.google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT) {
              reject(new Error('❌ Google Places API QUOTA EXCEEDED. You have hit the daily limit. Wait 24 hours or upgrade your plan.'));
            } else {
              console.log('✅ API key test successful - proceeding with HARD SEARCH');
              resolve();
            }
          });
        });
      } catch (apiError) {
        throw apiError;
      }
      
      let allResults = [];
      
      // STRATEGY 1: Comprehensive Text Search with location-specific queries
      console.log('STRATEGY 1: Comprehensive text search for salons...');
      
      // Add location-specific famous salon searches
      const locationSpecificQueries = [];
      const locationLower = (location.address || '').toLowerCase();
      
      console.log('Processing location:', locationLower);
      
      if (locationLower.includes('patia') || locationLower.includes('bhubaneswar')) {
        locationSpecificQueries.push(
          'Looks Salon Patia',
          'Naturals Salon Bhubaneswar',
          'Lakme Salon Bhubaneswar',
          'VLCC Bhubaneswar',
          'Jawed Habib Bhubaneswar',
          'Green Trends Bhubaneswar',
          'Bounce Salon Bhubaneswar',
          'Enrich Salon Bhubaneswar',
          'salon Patia Bhubaneswar',
          'beauty parlour Patia',
          'hair salon Jaydev Vihar',
          'unisex salon Patia Square'
        );
      }
      
      const textSearchQueries = [
        ...locationSpecificQueries,
        `salon ${location.address}`,
        `beauty salon ${location.address}`,
        `hair salon ${location.address}`,
        `parlour ${location.address}`,
        `barber ${location.address}`,
        `spa ${location.address}`,
        'salon near me',
        'beauty parlour',
        'hair cutting salon',
        'unisex salon',
        'ladies salon',
        'gents salon',
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
              radius: 20000 // 20km radius for hard search
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
      
      // STRATEGY 2: Comprehensive Nearby Search (always run)
      console.log('STRATEGY 2: Comprehensive nearby search...');
      const nearbySearches = [
        { type: 'beauty_salon', radius: 25000, keyword: null },
        { type: 'hair_care', radius: 25000, keyword: null },
        { type: 'spa', radius: 20000, keyword: null },
        { type: 'establishment', radius: 15000, keyword: 'salon' },
        { type: 'establishment', radius: 15000, keyword: 'beauty' },
        { type: 'establishment', radius: 15000, keyword: 'parlour' },
        { type: 'establishment', radius: 15000, keyword: 'barber' },
        { type: 'establishment', radius: 15000, keyword: 'hair' }
      ];
      
      for (const search of nearbySearches) {
        try {
          console.log(`Nearby search: ${search.type} (${search.radius/1000}km)${search.keyword ? ` - ${search.keyword}` : ''}`);
          const results = await new Promise((resolve, reject) => {
            const request = {
              location: new window.google.maps.LatLng(location.lat, location.lng),
              radius: search.radius,
              type: search.type
            };
            
            if (search.keyword) {
              request.keyword = search.keyword;
            }
            
            service.nearbySearch(request, (results, status) => {
              console.log(`${search.type}${search.keyword ? ` (${search.keyword})` : ''} - Status: ${status}, Results: ${results?.length || 0}`);
              
              if (status === window.google.maps.places.PlacesServiceStatus.OK) {
                resolve(results || []);
              } else if (status === window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
                resolve([]);
              } else {
                console.warn(`${search.type} search failed: ${status}`);
                resolve([]);
              }
            });
          });
          
          if (results.length > 0) {
            console.log(`✅ Found ${results.length} results for ${search.type}${search.keyword ? ` (${search.keyword})` : ''}`);
            allResults = allResults.concat(results);
          }
          
          // Longer delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (error) {
          console.error(`Nearby search failed for ${search.type}:`, error);
        }
      }
      
      // STRATEGY 3: Broader area search if still limited results
      if (allResults.length < 10) {
        console.log('STRATEGY 3: Broader area search...');
        const cityName = (location.address || 'nearby area').split(',')[0].trim(); // Get city name
        const broadQueries = [
          `salon ${cityName}`,
          `beauty parlour ${cityName}`,
          `hair salon ${cityName}`,
          `barber shop ${cityName}`,
          `spa ${cityName}`,
          `unisex salon ${cityName}`
        ];
        
        for (const query of broadQueries) {
          try {
            console.log(`Broad search: "${query}"`);
            const results = await new Promise((resolve, reject) => {
              const request = {
                query: query,
                location: new window.google.maps.LatLng(location.lat, location.lng),
                radius: 50000 // 50km radius for very broad search
              };
              
              service.textSearch(request, (results, status) => {
                if (status === window.google.maps.places.PlacesServiceStatus.OK) {
                  resolve(results || []);
                } else {
                  resolve([]);
                }
              });
            });
            
            if (results.length > 0) {
              console.log(`✅ Broad search found ${results.length} results for "${query}"`);
              allResults = allResults.concat(results);
            }
            
            await new Promise(resolve => setTimeout(resolve, 400));
          } catch (error) {
            console.error(`Broad search failed for "${query}":`, error);
          }
        }
      }
      
      // Process and filter all results with enhanced filtering
      console.log(`Processing ${allResults.length} total results...`);
      
      // Remove duplicates based on place_id and apply enhanced filtering
      const uniqueResults = [];
      const seenIds = new Set();
      
      for (const place of allResults) {
        if (!seenIds.has(place.place_id)) {
          seenIds.add(place.place_id);
          
          // Enhanced filtering - be more inclusive for hard search
          const name = place.name.toLowerCase();
          const types = place.types ? place.types.join(' ').toLowerCase() : '';
          const vicinity = (place.vicinity || '').toLowerCase();
          
          const isSalonRelated = 
            name.includes('salon') || 
            name.includes('beauty') || 
            name.includes('hair') || 
            name.includes('parlour') || 
            name.includes('parlor') ||
            name.includes('spa') ||
            name.includes('unisex') ||
            name.includes('barber') ||
            name.includes('cut') ||
            name.includes('style') ||
            name.includes('glamour') ||
            name.includes('looks') ||
            name.includes('makeover') ||
            name.includes('trim') ||
            name.includes('shave') ||
            types.includes('beauty_salon') ||
            types.includes('hair_care') ||
            types.includes('spa') ||
            vicinity.includes('salon') ||
            vicinity.includes('beauty');
          
          if (isSalonRelated) {
            uniqueResults.push(place);
          }
        }
      }
      
      console.log(`✅ HARD SEARCH COMPLETE: Found ${uniqueResults.length} unique salon-related businesses`);
      
      // Debug: Show what we found
      if (uniqueResults.length > 0) {
        console.log('HARD SEARCH RESULTS:');
        uniqueResults.slice(0, 15).forEach((place, index) => {
          const distance = calculateDistance(location.lat, location.lng, 
            place.geometry.location.lat(), place.geometry.location.lng());
          console.log(`${index + 1}. ${place.name} - ${distance.toFixed(1)}km - Rating: ${place.rating || 'N/A'}`);
        });
      }
      
      if (uniqueResults.length === 0) {
        console.log('❌ HARD SEARCH FOUND ZERO SALONS - Possible reasons:');
        console.log('   • Google Places API quota exceeded (1000 requests/day limit)');
        console.log('   • No salons registered in Google Maps for this specific area');
        console.log('   • API key restrictions or billing issues');
        console.log('   • Network connectivity problems');
        console.log('   • Location coordinates invalid or not recognized');
        console.log('');
        console.log('TROUBLESHOOTING STEPS:');
        console.log('   1. Check Google Console > APIs & Services > Quotas');
        console.log('   2. Verify API key in .env file');
        console.log('   3. Try a major city like "Mumbai" or "Delhi"');
        console.log('   4. Check network connection');
        console.log('   5. Wait 24 hours if quota exceeded');
        
        throw new Error(`HARD SEARCH: No salons found near "${location.address}". This means either (1) Google Places API quota exceeded, (2) No salons registered on Google Maps in this area, or (3) API configuration issues. Try a major city or check API quota in Google Console.`);
      }
      
      // Sort results by distance and rating for better relevance
      uniqueResults.sort((a, b) => {
        const distanceA = calculateDistance(location.lat, location.lng, 
          a.geometry.location.lat(), a.geometry.location.lng());
        const distanceB = calculateDistance(location.lat, location.lng, 
          b.geometry.location.lat(), b.geometry.location.lng());
        
        // Prioritize closer salons, then by rating
        if (Math.abs(distanceA - distanceB) < 2) { // If within 2km, sort by rating
          return (b.rating || 4.0) - (a.rating || 4.0);
        }
        return distanceA - distanceB;
      });
      
      // Process and format results
      const processedSalons = uniqueResults.slice(0, 50).map(place => { // Limit to top 50 results
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
      .slice(0, 30); // Limit to 30 results for better coverage
      
      console.log(`✅ Returning ${processedSalons.length} processed REAL salons`);
      return processedSalons;
      
    } catch (error) {
      console.error('❌ HARD SEARCH completely failed:', error);
      console.error('❌ This could be due to:');
      console.error('   • Google Places API quota exceeded');
      console.error('   • API key restrictions or invalid key');
      console.error('   • Network connectivity issues');
      console.error('   • No salons registered in Google Maps for this area');
      throw new Error(`HARD SEARCH failed: ${error.message}. Check console for details.`);
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

  // Get detailed services for queue modal
  const getServicesForSalon = (salon) => {
    const baseServices = {
      'Beauty Salon': [
        { id: 1, name: 'Haircut & Styling', duration: 45, price: 500, description: 'Professional haircut with styling' },
        { id: 2, name: 'Hair Wash & Blow Dry', duration: 30, price: 300, description: 'Deep cleansing and styling' },
        { id: 3, name: 'Facial Treatment', duration: 60, price: 800, description: 'Deep cleansing facial with mask' },
        { id: 4, name: 'Eyebrow Threading', duration: 15, price: 150, description: 'Precise eyebrow shaping' },
        { id: 5, name: 'Manicure', duration: 45, price: 400, description: 'Complete nail care and polish' },
        { id: 6, name: 'Pedicure', duration: 60, price: 600, description: 'Foot care and nail polish' }
      ],
      'Barber Shop': [
        { id: 1, name: 'Classic Haircut', duration: 30, price: 300, description: 'Traditional men\'s haircut' },
        { id: 2, name: 'Beard Trim & Style', duration: 20, price: 200, description: 'Professional beard grooming' },
        { id: 3, name: 'Hot Towel Shave', duration: 30, price: 350, description: 'Traditional wet shave experience' },
        { id: 4, name: 'Hair Wash & Style', duration: 25, price: 250, description: 'Shampoo and styling' },
        { id: 5, name: 'Mustache Trim', duration: 10, price: 100, description: 'Precise mustache grooming' }
      ],
      'Spa & Salon': [
        { id: 1, name: 'Luxury Haircut', duration: 60, price: 800, description: 'Premium haircut with consultation' },
        { id: 2, name: 'Deep Tissue Massage', duration: 90, price: 1500, description: 'Therapeutic full body massage' },
        { id: 3, name: 'Aromatherapy Facial', duration: 75, price: 1200, description: 'Relaxing facial with essential oils' },
        { id: 4, name: 'Body Spa Package', duration: 120, price: 2500, description: 'Complete body treatment' },
        { id: 5, name: 'Hair Spa Treatment', duration: 90, price: 1000, description: 'Deep conditioning hair treatment' }
      ],
      'Unisex Salon': [
        { id: 1, name: 'Haircut (Men/Women)', duration: 45, price: 400, description: 'Professional unisex haircut' },
        { id: 2, name: 'Hair Coloring', duration: 120, price: 1200, description: 'Professional hair coloring service' },
        { id: 3, name: 'Facial Treatment', duration: 60, price: 700, description: 'Suitable for all skin types' },
        { id: 4, name: 'Threading & Waxing', duration: 30, price: 300, description: 'Hair removal services' },
        { id: 5, name: 'Bridal Package', duration: 180, price: 3000, description: 'Complete bridal makeover' }
      ]
    };

    return baseServices[salon.type] || baseServices['Beauty Salon'];
  };

  // Handle salon selection for join queue
  const handleJoinQueueSelect = (salon) => {
    setSelectedSalonForPage(salon);
    setShowJoinQueuePage(true);
  };

  // Handle salon selection for book appointment
  const handleBookAppointmentSelect = (salon) => {
    setSelectedSalonForPage(salon);
    setShowBookAppointmentPage(true);
  };

  // Handle salon selection for more info
  const handleMoreInfoSelect = (salon) => {
    setSelectedSalonForPage(salon);
    setShowMoreInfoPage(true);
  };

  // Handle direct queue joining
  const handleDirectJoinQueue = (salon) => {
    setQueueSalon(salon);
    setShowQueueModal(true);
  };

  // Handle queue joining completion
  const handleQueueJoinComplete = (queueData) => {
    console.log('Queue joined:', queueData);
    toast.success(`Successfully joined queue at ${queueSalon.name}!`);
    
    // Create a booking object with necessary details
    const newBooking = {
      id: `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      salonId: queueSalon.id,
      salonName: queueSalon.name,
      customerName: queueData.name,
      customerPhone: queueData.phone,
      customerEmail: queueData.email,
      selectedServices: queueData.selectedServices,
      totalAmount: queueData.totalAmount,
      totalDuration: queueData.totalDuration,
      type: 'queue',
      status: 'in_queue',
      paymentId: queueData.paymentId,
      createdAt: new Date().toISOString(),
      queuePosition: queueSalon.queueLength + 1,
      estimatedWaitTime: queueSalon.waitTime
    };
    
    // Add to user bookings
    setUserBookings(prev => [newBooking, ...prev]);
    
    // Set as current booking for real-time updates
    setCurrentBooking(newBooking);
    
    // Close queue modal and show booking updates modal
    setShowQueueModal(false);
    setQueueSalon(null);
    setShowBookingUpdates(true);
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
      console.log('Location obtained:', location);
      
      setLoadingStatus('Finding address...');
      
      // Reverse geocode to get proper address
      let address = `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;
      try {
        // Load Google Maps if not loaded
        await loadGoogleMaps();
        while (!window.google || !window.google.maps) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        const geocoder = new window.google.maps.Geocoder();
        const reverseResult = await new Promise((resolve, reject) => {
          geocoder.geocode({ location: { lat: location.lat, lng: location.lng } }, (results, status) => {
            if (status === 'OK' && results[0]) {
              resolve(results[0].formatted_address);
            } else {
              resolve(address); // fallback to coordinates
            }
          });
        });
        address = reverseResult;
      } catch (error) {
        console.log('Reverse geocoding failed, using coordinates');
      }
      
      setUserLocation(location);
      setLocationName(address);
      
      setLoadingStatus('Searching for nearby salons...');
      
      const locationData = {
        lat: location.lat,
        lng: location.lng,
        address: address
      };
      
      console.log('Calling HARD SEARCH with current location:', locationData);
      const results = await searchNearbyPlaces(locationData);
      
      if (results && results.length > 0) {
        setSalons(results);
        console.log(`✅ Successfully loaded ${results.length} salons`);
        setLoadingStatus('');
        
        // Load user bookings from localStorage
        loadUserBookings();
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
      console.log('Geocoded location:', result);
      
      setUserLocation({ lat: result.lat, lng: result.lng });
      setLocationName(result.formatted_address);
      
      setLoadingStatus('Searching for nearby salons...');
      
      const locationData = {
        lat: result.lat,
        lng: result.lng,
        address: result.formatted_address || address
      };
      
      console.log('Calling HARD SEARCH with:', locationData);
      console.log('About to call searchNearbyPlaces function...');
      
      const results = await searchNearbyPlaces(locationData);
      
      console.log('HARD SEARCH returned:', results);
      console.log('Number of results:', results ? results.length : 0);
      
      if (results && results.length > 0) {
        setSalons(results);
        console.log(`✅ Successfully loaded ${results.length} salons`);
        setLoadingStatus('');
        
        // Load user bookings from localStorage
        loadUserBookings();
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

  // Load user bookings from localStorage
  const loadUserBookings = () => {
    try {
      const savedBookings = localStorage.getItem('userBookings');
      if (savedBookings) {
        const bookings = JSON.parse(savedBookings);
        setUserBookings(bookings);
      }
    } catch (error) {
      console.error('Failed to load bookings:', error);
    }
  };

  // Save booking to localStorage
  const saveBooking = (bookingData) => {
    try {
      const booking = {
        id: `booking_${Date.now()}`,
        ...bookingData,
        status: 'confirmed',
        createdAt: new Date().toISOString(),
        type: bookingData.type || 'appointment' // 'appointment' or 'queue'
      };

      const updatedBookings = [...userBookings, booking];
      setUserBookings(updatedBookings);
      localStorage.setItem('userBookings', JSON.stringify(updatedBookings));
      
      return booking;
    } catch (error) {
      console.error('Failed to save booking:', error);
      return null;
    }
  };

  // Update booking status
  const updateBookingStatus = (bookingId, newStatus) => {
    try {
      const updatedBookings = userBookings.map(booking =>
        booking.id === bookingId
          ? { ...booking, status: newStatus, updatedAt: new Date().toISOString() }
          : booking
      );
      
      setUserBookings(updatedBookings);
      localStorage.setItem('userBookings', JSON.stringify(updatedBookings));
    } catch (error) {
      console.error('Failed to update booking:', error);
    }
  };

  // Get all available services from salons
  const getAllServices = () => {
    const allServices = new Set();
    salons.forEach(salon => {
      salon.services.forEach(service => allServices.add(service));
    });
    return Array.from(allServices).sort();
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setSortBy('distance');
    setFilterByService('all');
    setFilterByRating('all');
    setFilterByPrice('all');
  };

  // Render location setup if no location
  if (!userLocation) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)',
        color: '#ffffff'
      }}>
        <div className="app-nav">
          <Link to="/owner" className="owner-link">
            Salon Owner? Manage Your Queue →
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
    <div className="app" style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)',
      color: '#ffffff'
    }}>
      <header className="app-header">
        <div className="header-brand">
          <h1>Babuu</h1>
          <p className="tagline">Groom kar de aapko?</p>
        </div>
        <div className="location-info">
          <span className="location-icon"></span>
          <span className="location-text">{locationName}</span>
        </div>
        <div className="header-actions">
          <button 
            onClick={() => setShowBookings(true)}
            className="bookings-btn"
          >
            My Bookings ({userBookings.length})
          </button>
          <button 
            onClick={() => setUserLocation(null)}
            className="change-location-btn"
          >
            Change Location
          </button>
          <Link to="/owner" className="owner-link-header">
            Owner Dashboard
          </Link>
        </div>
      </header>

      {/* Search and Filter Bar */}
      <div className="search-filter-bar">
        <div className="search-section">
          <div className="search-input-container">
            <input
              type="text"
              placeholder="🔎 Search salons, services, or areas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        <div className="filter-section">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`filter-toggle-btn ${showFilters ? 'active' : ''}`}
          >
            Filters {(filterByService !== 'all' || filterByRating !== 'all' || filterByPrice !== 'all') && '●'}
          </button>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="distance">Sort by Distance</option>
            <option value="rating">Sort by Rating</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
            <option value="queue">Shortest Queue</option>
            <option value="name">Sort by Name</option>
          </select>
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="advanced-filters">
          <div className="filter-row">
            <div className="filter-group">
              <label>Service:</label>
              <select
                value={filterByService}
                onChange={(e) => setFilterByService(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Services</option>
                {getAllServices().map(service => (
                  <option key={service} value={service}>{service}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Rating:</label>
              <select
                value={filterByRating}
                onChange={(e) => setFilterByRating(e.target.value)}
                className="filter-select"
              >
                <option value="all">Any Rating</option>
                <option value="4.5">4.5+ Stars</option>
                <option value="4.0">4.0+ Stars</option>
                <option value="3.5">3.5+ Stars</option>
                <option value="3.0">3.0+ Stars</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Price Range:</label>
              <select
                value={filterByPrice}
                onChange={(e) => setFilterByPrice(e.target.value)}
                className="filter-select"
              >
                <option value="all">Any Price</option>
                <option value="1">Budget</option>
                <option value="2">Moderate</option>
                <option value="3">Premium</option>
                <option value="4">Luxury</option>
              </select>
            </div>

            <button onClick={clearFilters} className="clear-filters-btn">
              Clear All
            </button>
          </div>
        </div>
      )}

      <main className="app-main">
        {loading && (
          <div className="search-loading">
            <div className="spinner"></div>
            <p>{loadingStatus}</p>
          </div>
        )}

        <div className="main-content">
          <div className="salon-list">
            <div className="salon-list-header">
              <h2>
                {searchQuery || filterByService !== 'all' || filterByRating !== 'all' || filterByPrice !== 'all'
                  ? `Found ${filteredSalons.length} salons`
                  : `Nearby Salons (${salons.length})`
                }
              </h2>
              {filteredSalons.length === 0 && salons.length > 0 && (
                <p className="no-results">No salons match your criteria. Try adjusting your filters.</p>
              )}
            </div>
            {(filteredSalons.length > 0 ? filteredSalons : salons).map(salon => (
              <div key={salon.place_id} className="salon-card">
                <div className="salon-card-header">
                  <div className="salon-avatar">
                    <div className="salon-logo">
                      {salon.name.charAt(0)}
                    </div>
                  </div>
                  <div className="salon-header-info">
                    <h3 className="salon-name">{salon.name}</h3>
                    <div className="salon-meta">
                      <div className="salon-rating">
                        <span className="star-icon">★</span>
                        <span className="rating-value">{salon.rating}</span>
                        <span className="distance-info">• {salon.distance < 1 ? 
                          `${Math.round(salon.distance * 1000)}m` : 
                          `${salon.distance.toFixed(1)}km`
                        }</span>
                      </div>
                      <div className={`salon-status ${salon.opening_hours?.open_now ? 'open' : 'closed'}`}>
                        <span className="status-dot"></span>
                        <span>{salon.opening_hours?.open_now ? 'Open' : 'Closed'}</span>
                      </div>
                    </div>
                  </div>
                  <div className={`wait-badge ${salon.queueLength <= 2 ? 'low' : salon.queueLength <= 5 ? 'medium' : 'high'}`}>
                    {salon.queueLength <= 2 ? 'Low' : salon.queueLength <= 5 ? 'Med' : 'High'}
                  </div>
                </div>

                <div className="salon-card-body">
                  <div className="salon-address">
                    <span className="address-icon"></span>
                    <span className="address-text">{salon.vicinity}</span>
                  </div>
                  
                  <div className="live-queue-section">
                    <div className="queue-header">
                      <span className="queue-title">Live Queue</span>
                      <span className="queue-position">#{salon.queueLength + 1} in queue</span>
                    </div>
                    <div className="queue-time">~{salon.queueLength * 15} min wait</div>
                  </div>

                  <div className="salon-services-preview">
                    <span className="services-label">Services:</span>
                    <span className="services-list">{salon.services.slice(0, 3).join(', ')}</span>
                    {salon.services.length > 3 && <span className="services-more">+{salon.services.length - 3} more</span>}
                  </div>
                </div>

                <div className="salon-card-actions">
                  <button 
                    className="action-btn primary-action"
                    onClick={() => handleJoinQueueSelect(salon)}
                  >
                    Join Queue
                  </button>
                  <button 
                    className="action-btn secondary-action"
                    onClick={() => handleBookAppointmentSelect(salon)}
                  >
                    Book Appointment
                  </button>
                  <button 
                    className="action-btn secondary-action info-action"
                    onClick={() => handleMoreInfoSelect(salon)}
                  >
                    <span className="info-icon">ℹ️</span>
                    More Info
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {/* Map removed for cleaner design */}
        </div>

        {/* Join Queue Page */}
        {showJoinQueuePage && selectedSalonForPage && (
          <JoinQueuePage 
            salon={selectedSalonForPage}
            onClose={() => {
              setShowJoinQueuePage(false);
              setSelectedSalonForPage(null);
            }}
            onComplete={() => {
              setShowJoinQueuePage(false);
              setSelectedSalonForPage(null);
            }}
          />
        )}

        {/* Book Appointment Page */}
        {showBookAppointmentPage && selectedSalonForPage && (
          <BookAppointmentPage 
            salon={selectedSalonForPage}
            onClose={() => {
              setShowBookAppointmentPage(false);
              setSelectedSalonForPage(null);
            }}
            onComplete={() => {
              setShowBookAppointmentPage(false);
              setSelectedSalonForPage(null);
            }}
          />
        )}

        {/* More Info Page */}
        {showMoreInfoPage && selectedSalonForPage && (
          <MoreInfoPage 
            salon={selectedSalonForPage}
            onClose={() => {
              setShowMoreInfoPage(false);
              setSelectedSalonForPage(null);
            }}
          />
        )}

        {/* Salon Details Modal */}
        {showSalonDetails && selectedSalon && (
          <SalonDetails 
            salon={selectedSalon}
            onClose={() => {
              setShowSalonDetails(false);
              setSelectedSalon(null);
            }}
            onBookingComplete={(bookingData) => {
              // Add to user bookings
              setUserBookings(prev => [bookingData, ...prev]);
              setShowSalonDetails(false);
              setSelectedSalon(null);
            }}
            initialTab={salonDetailsInitialTab}
          />
        )}

        {/* Queue Modal */}
        {showQueueModal && queueSalon && (
          <QueueModal
            salon={queueSalon}
            services={getServicesForSalon(queueSalon)}
            onJoinQueue={handleQueueJoinComplete}
            onClose={() => {
              setShowQueueModal(false);
              setQueueSalon(null);
            }}
          />
        )}

        {/* My Bookings Modal */}
        {showBookings && (
          <MyBookingsModal
            bookings={userBookings}
            onClose={() => setShowBookings(false)}
            onUpdateBooking={updateBookingStatus}
            salons={salons}
          />
        )}
        
        {/* Real-time Booking Updates Modal */}
        {showBookingUpdates && currentBooking && (
          <BookingUpdatesModal
            booking={currentBooking}
            onClose={() => setShowBookingUpdates(false)}
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
  
  // Generate a persistent user ID for WebSocket connections
  const [userId] = useState(() => {
    const storedId = localStorage.getItem('userId');
    if (storedId) return storedId;
    
    const newId = `user_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('userId', newId);
    return newId;
  });
  
  // Initialize WebSocket connection
  useEffect(() => {
    if (userId) {
      websocketService.connect(userId, 'customer');
    }
    
    return () => {
      websocketService.disconnect();
    };
  }, [userId]);
  
  return (
    <Router basename={basename}>
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)',
        color: '#ffffff'
      }}>
        <Toaster position="top-right" />
        <ConnectionStatus />
        <Routes>
          <Route path="/" element={<CustomerApp />} />
          <Route path="/owner" element={<OwnerPortal />} />
        </Routes>
      </div>
    </Router>
  );
}

// My Bookings Modal Component
function MyBookingsModal({ bookings, onClose, onUpdateBooking, salons }) {
  const [activeTab, setActiveTab] = useState('ongoing');

  const ongoingBookings = bookings.filter(booking => 
    booking.status === 'confirmed' || booking.status === 'in_progress' || booking.status === 'waiting' || booking.status === 'in_queue'
  );

  const completedBookings = bookings.filter(booking => 
    booking.status === 'completed' || booking.status === 'cancelled'
  );

  const getSalonName = (salonId) => {
    const salon = salons.find(s => s.place_id === salonId);
    return salon ? salon.name : 'Unknown Salon';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return '#28a745';
      case 'in_progress': return '#007bff';
      case 'waiting': return '#ffc107';
      case 'in_queue': return '#17a2b8';
      case 'completed': return '#6c757d';
      case 'cancelled': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed': return '✅';
      case 'in_progress': return '🔄';
      case 'waiting': return '⏳';
      case 'in_queue': return 'In Queue';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return 'Booking';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const calculateTotal = (services) => {
    if (!services || !Array.isArray(services)) return 0;
    return services.reduce((total, service) => total + (service.price || 0), 0);
  };

  return (
    <div className="bookings-modal-overlay">
      <div className="bookings-modal">
        <div className="bookings-modal-header">
          <h2>📋 My Bookings</h2>
          <button onClick={onClose} className="close-modal-btn">×</button>
        </div>

        <div className="bookings-tabs">
          <button 
            className={`bookings-tab ${activeTab === 'ongoing' ? 'active' : ''}`}
            onClick={() => setActiveTab('ongoing')}
          >
            🔄 Ongoing ({ongoingBookings.length})
          </button>
          <button 
            className={`bookings-tab ${activeTab === 'completed' ? 'active' : ''}`}
            onClick={() => setActiveTab('completed')}
          >
            ✨ History ({completedBookings.length})
          </button>
        </div>

        <div className="bookings-content">
          {activeTab === 'ongoing' && (
            <div className="bookings-list">
              {ongoingBookings.length === 0 ? (
                <div className="no-bookings">
                  <div className="no-bookings-icon">📅</div>
                  <h3>No ongoing bookings</h3>
                  <p>Your current appointments and queue entries will appear here.</p>
                </div>
              ) : (
                ongoingBookings.map(booking => (
                  <div key={booking.id} className="booking-card">
                    <div className="booking-header">
                      <div className="booking-salon">
                        <h3>{getSalonName(booking.salonId)}</h3>
                        <p className="booking-type">
                          {booking.type === 'queue' ? '👥 Queue Entry' : '📅 Appointment'}
                        </p>
                      </div>
                      <div className="booking-status">
                        <span 
                          className="status-badge"
                          style={{ backgroundColor: getStatusColor(booking.status) }}
                        >
                          {getStatusIcon(booking.status)} {booking.status}
                        </span>
                      </div>
                    </div>

                    <div className="booking-details">
                      <div className="booking-info">
                        <div className="info-item">
                          <span className="label">Customer:</span>
                          <span className="value">{booking.customerName}</span>
                        </div>
                        <div className="info-item">
                          <span className="label">Phone:</span>
                          <span className="value">{booking.customerPhone}</span>
                        </div>
                        {booking.preferredTime && (
                          <div className="info-item">
                            <span className="label">Time:</span>
                            <span className="value">{booking.preferredTime}</span>
                          </div>
                        )}
                        <div className="info-item">
                          <span className="label">Booked:</span>
                          <span className="value">{formatDate(booking.createdAt)}</span>
                        </div>
                        {booking.type === 'queue' && (
                          <>
                            <div className="info-item queue-position">
                              <span className="label">Queue Position:</span>
                              <span className="value queue-number">#{booking.queuePosition || 'Updating...'}</span>
                            </div>
                            <div className="info-item queue-wait">
                              <span className="label">Est. Wait Time:</span>
                              <span className="value">~{booking.estimatedWaitTime || 15} minutes</span>
                            </div>
                          </>
                        )}
                      </div>

                      <div className="booking-services">
                        <h4>Services:</h4>
                        <div className="services-list">
                          {booking.selectedServices?.map((service, index) => (
                            <div key={index} className="service-item">
                              <span className="service-name">{service.name}</span>
                              <span className="service-price">₹{service.price}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="booking-total">
                        <strong>Total: ₹{booking.totalAmount || calculateTotal(booking.selectedServices)}</strong>
                      </div>

                      {booking.specialRequests && (
                        <div className="booking-notes">
                          <h4>Special Requests:</h4>
                          <p>{booking.specialRequests}</p>
                        </div>
                      )}
                    </div>

                    <div className="booking-actions">
                      {booking.status === 'confirmed' && (
                        <button 
                          onClick={() => onUpdateBooking(booking.id, 'cancelled')}
                          className="cancel-booking-btn"
                        >
                          ❌ Cancel Booking
                        </button>
                      )}
                      {booking.paymentId && (
                        <div className="payment-info">
                          💳 Payment ID: {booking.paymentId.slice(-8)}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'completed' && (
            <div className="bookings-list">
              {completedBookings.length === 0 ? (
                <div className="no-bookings">
                  <div className="no-bookings-icon">📜</div>
                  <h3>No booking history</h3>
                  <p>Your completed and cancelled bookings will appear here.</p>
                </div>
              ) : (
                completedBookings.map(booking => (
                  <div key={booking.id} className="booking-card completed">
                    <div className="booking-header">
                      <div className="booking-salon">
                        <h3>{getSalonName(booking.salonId)}</h3>
                        <p className="booking-type">
                          {booking.type === 'queue' ? '👥 Queue Entry' : '📅 Appointment'}
                        </p>
                      </div>
                      <div className="booking-status">
                        <span 
                          className="status-badge"
                          style={{ backgroundColor: getStatusColor(booking.status) }}
                        >
                          {getStatusIcon(booking.status)} {booking.status}
                        </span>
                      </div>
                    </div>

                    <div className="booking-details">
                      <div className="booking-info">
                        <div className="info-item">
                          <span className="label">Customer:</span>
                          <span className="value">{booking.customerName}</span>
                        </div>
                        <div className="info-item">
                          <span className="label">Date:</span>
                          <span className="value">{formatDate(booking.createdAt)}</span>
                        </div>
                        {booking.updatedAt && booking.updatedAt !== booking.createdAt && (
                          <div className="info-item">
                            <span className="label">
                              {booking.status === 'completed' ? 'Completed:' : 'Updated:'}
                            </span>
                            <span className="value">{formatDate(booking.updatedAt)}</span>
                          </div>
                        )}
                      </div>

                      <div className="booking-services">
                        <h4>Services:</h4>
                        <div className="services-list">
                          {booking.selectedServices?.map((service, index) => (
                            <div key={index} className="service-item">
                              <span className="service-name">{service.name}</span>
                              <span className="service-price">₹{service.price}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="booking-total">
                        <strong>Total: ₹{booking.totalAmount || calculateTotal(booking.selectedServices)}</strong>
                      </div>

                      {booking.paymentId && (
                        <div className="payment-info">
                          💳 Payment ID: {booking.paymentId}
                        </div>
                      )}
                    </div>

                    <div className="booking-actions">
                      {booking.status === 'completed' && (
                        <button 
                          onClick={() => {
                            // Find the salon and open it for rebooking
                            const salon = salons.find(s => s.place_id === booking.salonId);
                            if (salon) {
                              onClose();
                              // This would trigger opening the salon details
                              // You might need to pass this up to the parent component
                            }
                          }}
                          className="rebook-btn"
                        >
                          🔄 Book Again
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
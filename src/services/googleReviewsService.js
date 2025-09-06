// Google Reviews Service
// Handles fetching real Google reviews and managing in-app reviews

class GoogleReviewsService {
  constructor() {
    this.apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    this.cache = new Map(); // Cache reviews to avoid repeated API calls
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes cache
  }

  // Check if Google Places API is available
  isGooglePlacesAvailable() {
    return !!(window.google && window.google.maps && window.google.maps.places);
  }

  // Get real Google reviews for a salon
  async getGoogleReviews(placeId) {
    try {
      // Check cache first
      const cached = this.cache.get(placeId);
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        console.log('📦 Using cached Google reviews for', placeId);
        return cached.reviews;
      }

      if (!this.isGooglePlacesAvailable()) {
        console.warn('⚠️ Google Places API not available');
        return [];
      }

      console.log('🔍 Fetching Google reviews for place:', placeId);

      const service = new window.google.maps.places.PlacesService(document.createElement('div'));
      
      return new Promise((resolve, reject) => {
        service.getDetails({
          placeId: placeId,
          fields: ['reviews', 'rating', 'user_ratings_total', 'name', 'formatted_address']
        }, (place, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK) {
            if (place.reviews && place.reviews.length > 0) {
              console.log('✅ Loaded', place.reviews.length, 'Google reviews for', place.name);
              
              // Process and format reviews
              const formattedReviews = place.reviews.map(review => ({
                id: `google_${review.time}_${review.author_name}`,
                author_name: review.author_name,
                rating: review.rating,
                text: review.text,
                time: review.time * 1000, // Convert to milliseconds
                profile_photo_url: review.profile_photo_url,
                relative_time_description: review.relative_time_description,
                source: 'google',
                place_id: placeId,
                place_name: place.name
              }));

              // Cache the results
              this.cache.set(placeId, {
                reviews: formattedReviews,
                timestamp: Date.now()
              });

              resolve(formattedReviews);
            } else {
              console.log('📝 No Google reviews available for', place.name);
              resolve([]);
            }
          } else if (status === window.google.maps.places.PlacesServiceStatus.REQUEST_DENIED) {
            console.error('❌ Google Places API request denied. Check API key and billing.');
            resolve([]);
          } else if (status === window.google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT) {
            console.error('❌ Google Places API quota exceeded.');
            resolve([]);
          } else {
            console.error('❌ Failed to fetch Google reviews:', status);
            resolve([]);
          }
        });
      });

    } catch (error) {
      console.error('❌ Error fetching Google reviews:', error);
      return [];
    }
  }

  // Get in-app reviews (stored locally)
  getInAppReviews(placeId) {
    try {
      const savedReviews = localStorage.getItem(`in_app_reviews_${placeId}`);
      if (savedReviews) {
        const reviews = JSON.parse(savedReviews);
        console.log('📱 Loaded', reviews.length, 'in-app reviews for', placeId);
        return reviews.map(review => ({
          ...review,
          source: 'in_app',
          place_id: placeId
        }));
      }
      return [];
    } catch (error) {
      console.error('❌ Error loading in-app reviews:', error);
      return [];
    }
  }

  // Save in-app review
  saveInAppReview(placeId, reviewData) {
    try {
      const existingReviews = this.getInAppReviews(placeId);
      const newReview = {
        id: `in_app_${Date.now()}_${reviewData.author_name}`,
        author_name: reviewData.author_name,
        rating: reviewData.rating,
        text: reviewData.text,
        time: Date.now(),
        profile_photo_url: null,
        relative_time_description: 'Just now',
        services: reviewData.services || [],
        source: 'in_app',
        place_id: placeId
      };

      const updatedReviews = [...existingReviews, newReview];
      localStorage.setItem(`in_app_reviews_${placeId}`, JSON.stringify(updatedReviews));
      
      console.log('💾 Saved in-app review for', placeId);
      return newReview;
    } catch (error) {
      console.error('❌ Error saving in-app review:', error);
      throw error;
    }
  }

  // Get all reviews (Google + In-app) for a salon
  async getAllReviews(placeId) {
    try {
      const [googleReviews, inAppReviews] = await Promise.all([
        this.getGoogleReviews(placeId),
        Promise.resolve(this.getInAppReviews(placeId))
      ]);

      // Combine and sort by time (newest first)
      const allReviews = [...googleReviews, ...inAppReviews].sort((a, b) => b.time - a.time);
      
      console.log('📊 Total reviews for', placeId, ':', allReviews.length, '(Google:', googleReviews.length, ', In-app:', inAppReviews.length, ')');
      
      return {
        reviews: allReviews,
        googleCount: googleReviews.length,
        inAppCount: inAppReviews.length,
        totalCount: allReviews.length
      };
    } catch (error) {
      console.error('❌ Error getting all reviews:', error);
      return {
        reviews: [],
        googleCount: 0,
        inAppCount: 0,
        totalCount: 0
      };
    }
  }

  // Get review statistics
  getReviewStats(reviews) {
    if (reviews.length === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      };
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;
    
    const ratingDistribution = reviews.reduce((dist, review) => {
      dist[review.rating] = (dist[review.rating] || 0) + 1;
      return dist;
    }, { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });

    return {
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      totalReviews: reviews.length,
      ratingDistribution
    };
  }

  // Format review date
  formatReviewDate(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60 * 1000) return 'Just now';
    if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))}m ago`;
    if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / (60 * 60 * 1000))}h ago`;
    if (diff < 7 * 24 * 60 * 60 * 1000) return `${Math.floor(diff / (24 * 60 * 60 * 1000))}d ago`;
    
    return new Date(timestamp).toLocaleDateString();
  }

  // Clear cache (useful for testing or forcing refresh)
  clearCache() {
    this.cache.clear();
    console.log('🗑️ Google reviews cache cleared');
  }
}

export default new GoogleReviewsService();

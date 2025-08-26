# 🚀 Complete Salon Ecosystem

A full-stack salon finder and queue management system with real-time updates, booking system, and payment integration.

## 🎯 Features

### 👥 Customer App
- **Real-time salon finder** with Google Places API
- **Interactive map** with salon markers
- **Live queue tracking** with wait times
- **Booking system** with service selection
- **Secure payments** via Razorpay (Indian market)
- **Push notifications** for queue updates
- **Distance calculation** and ratings

### 💼 Salon Owner Dashboard
- **Real-time queue management** (+/- customers)
- **Live business analytics** (revenue, customers, wait times)
- **Customer booking management**
- **Service and pricing management**
- **Shop open/close status**
- **Push notifications** for new bookings
- **Payment tracking**

### 🔄 Real-time Features
- **WebSocket connections** for instant updates
- **Firebase integration** for data persistence
- **Push notifications** via Firebase Cloud Messaging
- **Live queue synchronization**
- **Instant booking confirmations**

## 🛠️ Tech Stack

- **Frontend**: React, React Router, Socket.IO Client
- **Backend**: Node.js, Express, Socket.IO
- **Database**: Firebase Firestore
- **Payments**: Razorpay
- **Maps**: Google Maps API + Places API
- **Notifications**: Firebase Cloud Messaging
- **Styling**: CSS3 with modern animations

## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/yashvardhan1211/yvss.git
cd yvss
```

### 2. Install dependencies
```bash
# Install main app dependencies
npm install

# Install WebSocket server dependencies
cd websocket-server
npm install
cd ..
```

### 3. Set up environment variables

Create a `.env` file in the root directory:

```env
# Google Maps API Key
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id
REACT_APP_FIREBASE_VAPID_KEY=your_vapid_key

# Razorpay Configuration (Indian Payment Gateway)
REACT_APP_RAZORPAY_KEY_ID=rzp_test_your_razorpay_key

# WebSocket Server
REACT_APP_WEBSOCKET_URL=ws://localhost:3001
```

### 4. Set up Firebase

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Firestore Database
3. Enable Authentication
4. Enable Cloud Messaging
5. Add your domain to authorized domains
6. Copy configuration to `.env` file

### 5. Set up Google Maps API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable Maps JavaScript API and Places API
3. Create an API key
4. Add your domain to API key restrictions
5. Add the key to `.env` file

### 6. Set up Razorpay

1. Create a Razorpay account at [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Get your API key from the dashboard
3. Add it to `.env` file
4. Configure webhooks for production

### 7. Start the servers

```bash
# Terminal 1: Start WebSocket server
cd websocket-server
npm start

# Terminal 2: Start React app
npm start
```

## 📱 Usage

### Customer App (`/`)
1. **Find Salons**: Allow location access or search by address
2. **View Details**: See ratings, distance, queue length, and services
3. **Book Appointment**: Select services, choose time, and pay
4. **Track Queue**: Get real-time updates on your position

### Owner Dashboard (`/owner`)
1. **Login/Register**: Create salon owner account
2. **Manage Queue**: Add/remove customers in real-time
3. **View Analytics**: Track revenue, customers, and performance
4. **Handle Bookings**: Accept, complete, or manage appointments
5. **Update Services**: Modify pricing and available services

## 🔧 API Endpoints

### WebSocket Events

#### Customer Events
- `queue-updated`: Real-time queue changes
- `booking-confirmed`: Booking confirmation
- `your-turn`: Notification when it's customer's turn
- `payment-received`: Payment confirmation

#### Owner Events
- `new-booking`: New customer booking
- `payment-received`: Payment notifications
- `queue-updated`: Queue changes from other sources

### REST API
- `GET /api/salons` - Get all salons
- `POST /api/salons/:id/queue` - Update salon queue
- `GET /api/status` - Server status

## 🎨 Customization

### Styling
- Modify `src/App.css` for global styles
- Component-specific styles in `src/components/*.css`
- Responsive design included

### Features
- Add new services in salon dashboard
- Customize notification templates
- Modify queue calculation logic
- Add new payment methods

## 🚀 Deployment

### Frontend (Vercel/Netlify)
1. Connect your GitHub repository
2. Set environment variables
3. Deploy automatically

### Backend (Heroku/Railway)
1. Deploy WebSocket server
2. Update `REACT_APP_WEBSOCKET_URL`
3. Configure Firebase for production

### Firebase
1. Set up production Firestore rules
2. Configure authentication
3. Set up Cloud Functions for advanced features

## 📊 Monitoring

- **Real-time Dashboard**: `/api/status`
- **Firebase Console**: Monitor database and auth
- **Razorpay Dashboard**: Track payments
- **Google Cloud Console**: Monitor API usage

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

- **Issues**: GitHub Issues
- **Documentation**: This README
- **API Docs**: Check individual service files

## 🎉 Features Coming Soon

- [ ] Advanced analytics dashboard
- [ ] Customer loyalty program
- [ ] Multi-location support
- [ ] Advanced booking rules
- [ ] SMS notifications
- [ ] Review and rating system
- [ ] Staff management
- [ ] Inventory tracking

---

Built with ❤️ for salon owners and customers worldwide!
// Quick Test Setup - Create Owner Account for Hair Salon at IIT Patna
const fs = require('fs');
const path = require('path');

// Test Owner Data
const testOwner = {
  id: 'owner_iitp_hair_salon',
  email: 'owner@iitp-salon.com',
  password: 'test123', // Simple password for testing
  name: 'Rajesh Kumar',
  phone: '+91 9876543210',
  salon: {
    id: 'salon_iitp_hair',
    name: 'Elite Hair Studio IITP',
    address: 'Near Main Gate, IIT Patna, Bihta, Patna - 801106',
    phone: '+91 9876543210',
    email: 'contact@iitp-salon.com',
    description: 'Premium hair salon serving IIT Patna community with modern styling and grooming services.',
    services: [
      {
        id: 'haircut_men',
        name: 'Men\'s Haircut',
        description: 'Professional haircut with styling',
        price: 300,
        duration: 30,
        category: 'Haircut'
      },
      {
        id: 'haircut_women',
        name: 'Women\'s Haircut',
        description: 'Stylish cut with blow dry',
        price: 500,
        duration: 45,
        category: 'Haircut'
      },
      {
        id: 'beard_trim',
        name: 'Beard Trim & Styling',
        description: 'Professional beard grooming',
        price: 150,
        duration: 20,
        category: 'Grooming'
      },
      {
        id: 'hair_wash',
        name: 'Hair Wash & Conditioning',
        description: 'Deep cleansing with premium products',
        price: 200,
        duration: 25,
        category: 'Treatment'
      },
      {
        id: 'hair_color',
        name: 'Hair Coloring',
        description: 'Professional hair coloring service',
        price: 1200,
        duration: 90,
        category: 'Coloring'
      },
      {
        id: 'facial_men',
        name: 'Men\'s Facial',
        description: 'Refreshing facial treatment',
        price: 400,
        duration: 40,
        category: 'Facial'
      }
    ],
    hours: {
      monday: { open: '09:00', close: '20:00', closed: false },
      tuesday: { open: '09:00', close: '20:00', closed: false },
      wednesday: { open: '09:00', close: '20:00', closed: false },
      thursday: { open: '09:00', close: '20:00', closed: false },
      friday: { open: '09:00', close: '20:00', closed: false },
      saturday: { open: '09:00', close: '21:00', closed: false },
      sunday: { open: '10:00', close: '19:00', closed: false }
    },
    location: {
      lat: 25.5941,
      lng: 85.1376,
      city: 'Patna',
      state: 'Bihar',
      country: 'India'
    },
    amenities: ['AC', 'WiFi', 'Parking', 'Card Payment'],
    rating: 4.5,
    reviewCount: 127,
    isOpen: true,
    currentQueue: 3,
    estimatedWaitTime: 25
  }
};

// Create test data file
const testDataPath = path.join(__dirname, 'test-owner-data.json');
fs.writeFileSync(testDataPath, JSON.stringify(testOwner, null, 2));

console.log('🎉 Test Owner Setup Complete!');
console.log('');
console.log('📋 Your Test Salon Details:');
console.log(`Name: ${testOwner.salon.name}`);
console.log(`Address: ${testOwner.salon.address}`);
console.log(`Services: ${testOwner.salon.services.length} services available`);
console.log('');
console.log('🔑 Owner Login Credentials:');
console.log(`Email: ${testOwner.email}`);
console.log(`Password: ${testOwner.password}`);
console.log('');
console.log('🚀 Next Steps:');
console.log('1. Run: npm start');
console.log('2. Go to Owner Login');
console.log('3. Use the credentials above');
console.log('4. Manage your salon!');
console.log('');
console.log('💡 Test Features:');
console.log('- Add/remove customers from queue');
console.log('- Manage services and pricing');
console.log('- View real-time dashboard');
console.log('- Handle bookings and payments');
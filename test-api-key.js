#!/usr/bin/env node

/**
 * Quick API Key Test Script
 * Tests if Google Places API key is working
 */

const fs = require('fs');
const path = require('path');

console.log('🔑 GOOGLE PLACES API KEY TEST');
console.log('=============================');

// Read .env file
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env file not found!');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const apiKeyMatch = envContent.match(/REACT_APP_GOOGLE_MAPS_API_KEY=(.+)/);

if (!apiKeyMatch) {
  console.error('❌ REACT_APP_GOOGLE_MAPS_API_KEY not found in .env file!');
  process.exit(1);
}

const apiKey = apiKeyMatch[1].trim();
console.log('✅ API Key found in .env file');
console.log('🔑 API Key:', apiKey.substring(0, 10) + '...' + apiKey.substring(apiKey.length - 5));

// Test API key with a simple HTTP request
const https = require('https');

const testUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=20.3499,85.8197&radius=1000&type=establishment&key=${apiKey}`;

console.log('\\n🔍 Testing API key with Google Places API...');
console.log('📍 Test Location: Patia, Bhubaneswar (20.3499, 85.8197)');

https.get(testUrl, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      
      console.log('\\n📊 API RESPONSE:');
      console.log('Status:', response.status);
      
      if (response.status === 'OK') {
        console.log('✅ API KEY IS WORKING!');
        console.log('📍 Found', response.results.length, 'establishments near Patia');
        console.log('\\n🎯 Now testing salon-specific search...');
        
        // Test salon-specific search
        const salonUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=salon+Patia+Bhubaneswar&location=20.3499,85.8197&radius=10000&key=${apiKey}`;
        
        https.get(salonUrl, (salonRes) => {
          let salonData = '';
          
          salonRes.on('data', (chunk) => {
            salonData += chunk;
          });
          
          salonRes.on('end', () => {
            try {
              const salonResponse = JSON.parse(salonData);
              console.log('\\n💇 SALON SEARCH RESULTS:');
              console.log('Status:', salonResponse.status);
              console.log('Found', salonResponse.results.length, 'salon results');
              
              if (salonResponse.results.length > 0) {
                console.log('\\n🎯 FOUND SALONS:');
                salonResponse.results.slice(0, 5).forEach((salon, index) => {
                  console.log(`${index + 1}. ${salon.name} - ${salon.formatted_address}`);
                });
                console.log('\\n✅ HARD SEARCH SHOULD WORK! Your API key can find salons.');
              } else {
                console.log('\\n⚠️  No salons found in Patia, Bhubaneswar via API');
                console.log('   This means either:');
                console.log('   • No salons registered on Google Maps in this area');
                console.log('   • Salons are listed under different categories');
                console.log('   • Try searching "Mumbai" or "Delhi" for comparison');
              }
            } catch (error) {
              console.error('❌ Error parsing salon search response:', error.message);
            }
          });
        }).on('error', (error) => {
          console.error('❌ Salon search request failed:', error.message);
        });
        
      } else if (response.status === 'REQUEST_DENIED') {
        console.error('❌ API KEY IS INVALID OR RESTRICTED!');
        console.error('   Error:', response.error_message);
        console.error('\\n🔧 SOLUTIONS:');
        console.error('   1. Check API key in Google Console');
        console.error('   2. Enable Places API');
        console.error('   3. Remove domain/IP restrictions');
        console.error('   4. Enable billing if required');
      } else if (response.status === 'OVER_QUERY_LIMIT') {
        console.error('❌ API QUOTA EXCEEDED!');
        console.error('   You have hit the daily limit (1000 requests/day free)');
        console.error('\\n🔧 SOLUTIONS:');
        console.error('   1. Wait 24 hours for quota reset');
        console.error('   2. Upgrade to paid plan');
        console.error('   3. Check Google Console > Quotas');
      } else {
        console.error('❌ API ERROR:', response.status);
        if (response.error_message) {
          console.error('   Message:', response.error_message);
        }
      }
    } catch (error) {
      console.error('❌ Error parsing API response:', error.message);
      console.error('Raw response:', data.substring(0, 200) + '...');
    }
  });
}).on('error', (error) => {
  console.error('❌ API request failed:', error.message);
  console.error('\\n🔧 POSSIBLE ISSUES:');
  console.error('   1. No internet connection');
  console.error('   2. Firewall blocking requests');
  console.error('   3. Invalid API key format');
});

console.log('\\n⏳ Testing... (this may take a few seconds)');
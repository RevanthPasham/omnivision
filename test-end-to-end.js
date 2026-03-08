/**
 * End-to-End Test Script
 * Tests the complete flow: webhook -> message processing -> database
 * 
 * Usage:
 * 1. Make sure server is running: npm run dev
 * 2. Update WEBHOOK_URL with your ngrok URL or localhost
 * 3. Run: node test-end-to-end.js
 */

require('dotenv').config();
const axios = require('axios');

// Configuration
const SERVER_PORT = process.env.PORT || 3000;
const WEBHOOK_URL = process.env.WEBHOOK_URL || `http://localhost:${SERVER_PORT}/webhook`;
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'test_verify_token';

console.log('🧪 ==========================================');
console.log('🧪 End-to-End Test Suite');
console.log('🧪 ==========================================');
console.log(`📡 Server Port: ${SERVER_PORT}`);
console.log(`🌐 Webhook URL: ${WEBHOOK_URL}`);
console.log(`🔑 Verify Token: ${VERIFY_TOKEN}`);
console.log('🧪 ==========================================\n');

// Test 1: Health Check
async function testHealthCheck() {
  console.log('✅ Test 1: Health Check');
  try {
    const healthUrl = WEBHOOK_URL.replace('/webhook', '/health');
    const response = await axios.get(healthUrl, { timeout: 5000 });
    console.log('   ✅ Server is running');
    console.log('   📊 Response:', response.data);
    return true;
  } catch (error) {
    console.log('   ❌ Server is not running or not accessible');
    console.log('   💡 Make sure to run: npm run dev');
    return false;
  }
}

// Test 2: Webhook Verification
async function testWebhookVerification() {
  console.log('\n✅ Test 2: Webhook Verification');
  try {
    const response = await axios.get(WEBHOOK_URL, {
      params: {
        'hub.mode': 'subscribe',
        'hub.verify_token': VERIFY_TOKEN,
        'hub.challenge': 'test_challenge_12345'
      },
      timeout: 5000
    });
    
    if (response.status === 200 && response.data === 'test_challenge_12345') {
      console.log('   ✅ Webhook verification passed');
      return true;
    } else {
      console.log('   ❌ Webhook verification failed - wrong response');
      console.log('   📊 Status:', response.status);
      console.log('   📊 Data:', response.data);
      return false;
    }
  } catch (error) {
    console.log('   ❌ Webhook verification failed');
    if (error.response) {
      console.log('   📊 Status:', error.response.status);
      console.log('   📊 Data:', error.response.data);
    } else {
      console.log('   📊 Error:', error.message);
    }
    return false;
  }
}

// Test 3: Add Product Command
async function testAddProduct() {
  console.log('\n✅ Test 3: Add Product Command');
  
  const testMessage = {
    entry: [{
      changes: [{
        value: {
          messages: [{
            id: 'test_msg_' + Date.now(),
            from: '1234567890',
            type: 'text',
            text: {
              body: `add_product
title=Test Product ${Date.now()}
slug=test-product-${Date.now()}
price=99.99
stock=25
brand=Test Brand
material=Cotton`
            }
          }]
        }
      }]
    }]
  };

  try {
    console.log('   📤 Sending test message...');
    const response = await axios.post(WEBHOOK_URL, testMessage, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('   ✅ Message sent successfully');
    console.log('   📊 Status:', response.status);
    console.log('   📊 Response:', response.data);
    console.log('   💡 Check your server console for processing logs');
    console.log('   💡 Check your database for the new product');
    return true;
  } catch (error) {
    console.log('   ❌ Failed to send message');
    if (error.response) {
      console.log('   📊 Status:', error.response.status);
      console.log('   📊 Data:', error.response.data);
    } else {
      console.log('   📊 Error:', error.message);
    }
    return false;
  }
}

// Test 4: Invalid Message Format
async function testInvalidMessage() {
  console.log('\n✅ Test 4: Invalid Message Format (Should fail gracefully)');
  
  const invalidMessage = {
    entry: [{
      changes: [{
        value: {
          messages: [{
            id: 'test_invalid_' + Date.now(),
            from: '1234567890',
            type: 'text',
            text: {
              body: `Title: Test Product
Slug: test-slug
Price: 100`
            }
          }]
        }
      }]
    }]
  };

  try {
    const response = await axios.post(WEBHOOK_URL, invalidMessage, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('   ✅ Invalid message handled (should send error response)');
    console.log('   📊 Status:', response.status);
    return true;
  } catch (error) {
    console.log('   ❌ Error handling invalid message');
    if (error.response) {
      console.log('   📊 Status:', error.response.status);
    } else {
      console.log('   📊 Error:', error.message);
    }
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting tests...\n');
  
  const results = {
    healthCheck: await testHealthCheck(),
    webhookVerification: await testWebhookVerification(),
    addProduct: await testAddProduct(),
    invalidMessage: await testInvalidMessage()
  };
  
  console.log('\n📊 ==========================================');
  console.log('📊 Test Results Summary');
  console.log('📊 ==========================================');
  console.log(`Health Check:        ${results.healthCheck ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Webhook Verification: ${results.webhookVerification ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Add Product:         ${results.addProduct ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Invalid Message:      ${results.invalidMessage ? '✅ PASS' : '❌ FAIL'}`);
  console.log('📊 ==========================================\n');
  
  const allPassed = Object.values(results).every(r => r === true);
  
  if (allPassed) {
    console.log('🎉 All tests passed!');
  } else {
    console.log('⚠️  Some tests failed. Check the output above for details.');
    console.log('\n💡 Troubleshooting:');
    console.log('   1. Make sure server is running: npm run dev');
    console.log('   2. Check server console for errors');
    console.log('   3. Verify .env file has correct values');
    console.log('   4. Check database connection');
  }
}

// Run tests
runAllTests().catch(console.error);

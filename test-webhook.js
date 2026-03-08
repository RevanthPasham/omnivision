/**
 * Test script to verify webhook is working
 * Run: node test-webhook.js
 */

const axios = require('axios');

// Update this with your ngrok URL
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://localhost:3000/webhook';

// Test webhook verification
async function testVerification() {
  console.log('🧪 Testing webhook verification...');
  try {
    const response = await axios.get(WEBHOOK_URL, {
      params: {
        'hub.mode': 'subscribe',
        'hub.verify_token': process.env.WHATSAPP_VERIFY_TOKEN || 'test_token',
        'hub.challenge': 'test_challenge_123'
      }
    });
    console.log('✅ Verification test passed:', response.status);
    console.log('Response:', response.data);
  } catch (error) {
    console.error('❌ Verification test failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

// Test webhook message reception
async function testMessageReception() {
  console.log('\n🧪 Testing message reception...');
  
  const testMessage = {
    entry: [{
      changes: [{
        value: {
          messages: [{
            id: 'test_msg_' + Date.now(),
            from: '1234567890', // Test phone number
            type: 'text',
            text: {
              body: `add_product
title=Test Product
slug=test-product-${Date.now()}
price=100
stock=10`
            }
          }]
        }
      }]
    }]
  };

  try {
    const response = await axios.post(WEBHOOK_URL, testMessage, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Message reception test passed:', response.status);
    console.log('Response:', response.data);
  } catch (error) {
    console.error('❌ Message reception test failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Full error:', error);
    }
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting webhook tests...\n');
  console.log('Webhook URL:', WEBHOOK_URL);
  console.log('Verify Token:', process.env.WHATSAPP_VERIFY_TOKEN || 'test_token');
  console.log('---\n');
  
  await testVerification();
  await testMessageReception();
  
  console.log('\n✅ Tests completed!');
}

runTests().catch(console.error);

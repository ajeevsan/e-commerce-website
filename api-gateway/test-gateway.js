// test-gateway.js - Run this to test your gateway
const axios = require('axios');

const GATEWAY_URL = 'http://localhost:4000';
const AUTH_SERVICE_URL = 'http://localhost:3000';

async function testEndpoint(description, url, method = 'GET', data = null) {
    console.log(`\n🧪 Testing: ${description}`);
    console.log(`📍 URL: ${url}`);
    
    try {
        const config = {
            method,
            url,
            timeout: 5000,
        };
        
        if (data) {
            config.data = data;
            config.headers = { 'Content-Type': 'application/json' };
        }
        
        const response = await axios(config);
        console.log(`✅ Success: ${response.status} ${response.statusText}`);
        console.log(`📄 Response:`, response.data);
        return true;
    } catch (error) {
        console.log(`❌ Failed: ${error.response?.status || 'NO_RESPONSE'} ${error.response?.statusText || error.message}`);
        if (error.response?.data) {
            console.log(`📄 Error Response:`, error.response.data);
        }
        return false;
    }
}

async function runTests() {
    console.log('🚀 Starting API Gateway Tests...\n');
    
    // Test 1: Gateway health
    await testEndpoint('Gateway Health Check', `${GATEWAY_URL}/health`);
    
    // Test 2: Gateway test endpoint
    await testEndpoint('Gateway Test Endpoint', `${GATEWAY_URL}/test`);
    
    // Test 3: Routes list
    await testEndpoint('Gateway Routes List', `${GATEWAY_URL}/routes`);
    
    // Test 4: Direct auth service (bypass gateway)
    await testEndpoint('Direct Auth Service Health', `${AUTH_SERVICE_URL}/health`);
    
    // Test 5: Auth service through gateway
    await testEndpoint('Auth Service via Gateway', `${GATEWAY_URL}/api/auth/health`);
    
    // Test 6: Services health check
    await testEndpoint('All Services Health via Gateway', `${GATEWAY_URL}/health/services`);
    
    // Test 7: Try a non-existent route
    await testEndpoint('Non-existent Route (should 404)', `${GATEWAY_URL}/api/nonexistent`);
    
    // Test 8: Test send-otp endpoint through gateway
    await testEndpoint(
        'Send OTP via Gateway', 
        `${GATEWAY_URL}/api/auth/send-otp`,
        'POST',
        { email: 'test@example.com' }
    );
    
    console.log('\n🏁 Tests completed!');
    console.log('\n💡 Debugging Tips:');
    console.log('1. Make sure all your services are running on their respective ports');
    console.log('2. Check the gateway console for detailed logs');
    console.log('3. Verify your service health endpoints work directly');
    console.log('4. Check if your services are accepting requests from the gateway IP');
}

// Run the tests
runTests().catch(console.error);
// test/e2e/auth-integration.spec.js
const { test, expect } = require('./setup/test-setup');
const ApiHelper = require('./helpers/api-helper');
const TestDataHelper = require('./helpers/test-data');

test.describe('Auth Service Integration Tests', () => {
  test.use({ dbCleanup: true });

  test('complete user journey: register -> login -> logout', async ({ apiContext }) => {
    const api = new ApiHelper(apiContext);
    const userData = TestDataHelper.generateUserData();

    // Step 1: Register
    const { response: registerResponse, data: registerData } = await api.register(userData);
    expect(registerResponse.status()).toBe(201);
    expect(registerData.token).toBeDefined();

    // Step 2: Login
    const { response: loginResponse, data: loginData } = await api.login({
      email: userData.email,
      password: userData.password,
    });
    expect(loginResponse.status()).toBe(200);
    expect(loginData.token).toBeDefined();
    expect(loginData.userId).toBeDefined();

    // Step 3: Logout
    const { response: logoutResponse, data: logoutData } = await api.logout(loginData.token);
    expect(logoutResponse.status()).toBe(200);
    expect(logoutData.message).toBe('Logged out successfully');
  });

  test('OTP registration flow: send OTP -> verify OTP', async ({ apiContext }) => {
    const api = new ApiHelper(apiContext);
    const email = TestDataHelper.generateUniqueEmail();

    // Step 1: Send OTP
    const { response: otpResponse } = await api.sendOTP(email);
    expect(otpResponse.status()).toBe(200);

    // Step 2: Get OTP from Redis (for testing purposes)
    const { redisClient } = require('../../config/cache');
    const cachedData = await redisClient.get(`otp:${email}`);
    const parsedData = JSON.parse(cachedData);
    const otp = parsedData.otp.toString();

    // Step 3: Verify OTP
    const { response: verifyResponse, data: verifyData } = await api.verifyOTP({
      email,
      otp,
      name: 'Test User',
      password: 'password123',
    });
    expect(verifyResponse.status()).toBe(201);
    expect(verifyData.success).toBe(true);
  });
});
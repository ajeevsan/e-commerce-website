// test/e2e/auth-otp.spec.js
const { test, expect } = require('./setup/test-setup');
const ApiHelper = require('./helpers/api-helper');
const TestDataHelper = require('./helpers/test-data');
const { redisClient } = require('../../config/cache');

test.describe('OTP API', () => {
  test.use({ dbCleanup: true });

  test('should send OTP successfully', async ({ apiContext }) => {
    const api = new ApiHelper(apiContext);
    const email = TestDataHelper.generateUniqueEmail();

    const { response, data } = await api.sendOTP(email);

    expect(response.status(200));
    expect(data.message).toBe('OTP sent to email.');

    // Verify OTP is stored in Redis
    const cachedData = await redisClient.get(`otp:${email}`);
    expect(cachedData).toBeDefined();
    
    const parsedData = JSON.parse(cachedData);
    expect(parsedData.otp).toBeDefined();
    expect(parsedData.loginTime).toBeDefined();
  });

  test('should verify OTP successfully for new user', async ({ apiContext }) => {
    const api = new ApiHelper(apiContext);
    const email = TestDataHelper.generateUniqueEmail();
    const testOTP = TestDataHelper.generateOTP();

    // Manually set OTP in Redis for testing
    await redisClient.set(`otp:${email}`, JSON.stringify({
      otp: parseInt(testOTP),
      loginTime: new Date().toISOString()
    }), 300);

    const { response, data } = await api.verifyOTP({
      email,
      otp: testOTP,
      name: 'Test User',
      password: 'password123',
    });

    expect(response.status()).toBe(201);
    expect(data.success).toBe(true);
    expect(data.message).toBe('User registered successfully.');

    // Verify OTP is removed from Redis
    const cachedData = await redisClient.get(`otp:${email}`);
    expect(cachedData).toBeNull();
  });

  test('should reject invalid OTP', async ({ apiContext }) => {
    const api = new ApiHelper(apiContext);
    const email = TestDataHelper.generateUniqueEmail();
    const correctOTP = TestDataHelper.generateOTP();
    const wrongOTP = '000000';

    // Set correct OTP in Redis
    await redisClient.set(`otp:${email}`, JSON.stringify({
      otp: parseInt(correctOTP),
      loginTime: new Date().toISOString()
    }), 300);

    const { response, data } = await api.verifyOTP({
      email,
      otp: wrongOTP,
      name: 'Test User',
      password: 'password123',
    });

    expect(response.status()).toBe(400);
    expect(data.message).toBe('Invalid or expired OTP.');
  });

  test('should reject OTP verification for existing user', async ({ apiContext }) => {
    const api = new ApiHelper(apiContext);
    const userData = TestDataHelper.generateUserData();
    const testOTP = TestDataHelper.generateOTP();

    // Register user first
    await api.register(userData);

    // Set OTP in Redis
    await redisClient.set(`otp:${userData.email}`, JSON.stringify({
      otp: parseInt(testOTP),
      loginTime: new Date().toISOString()
    }), 300);

    const { response, data } = await api.verifyOTP({
      email: userData.email,
      otp: testOTP,
      name: userData.name,
      password: userData.password,
    });

    expect(response.status()).toBe(400);
    expect(data.success).toBe(false);
    expect(data.message).toBe('User already exists.');
  });
});
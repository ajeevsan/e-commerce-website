// test/e2e/auth-register.spec.js
const { test, expect } = require('./setup/test-setup');
const ApiHelper = require('./helpers/api-helper');
const TestDataHelper = require('./helpers/test-data');

test.describe('User Registration API', () => {
  test.use({ dbCleanup: true });

  test('should register a new user successfully', async ({ apiContext }) => {
    const api = new ApiHelper(apiContext);
    const userData = TestDataHelper.generateUserData();

    const { response, data } = await api.register(userData);

    expect(response.status()).toBe(201);
    expect(data.message).toBe('User Registered Successfully');
    expect(data.token).toBeDefined();
  });

  test('should reject registration with existing email', async ({ apiContext }) => {
    const api = new ApiHelper(apiContext);
    const userData = TestDataHelper.generateUserData();

    // Register user first time
    await api.register(userData);

    // Try to register again with same email
    const { response, data } = await api.register(userData);

    expect(response.status()).toBe(400);
    expect(data.msg).toBe('User exists');
  });

  test('should reject registration with missing fields', async ({ apiContext }) => {
    const api = new ApiHelper(apiContext);

    const { response } = await api.register({
      name: 'Test User',
      // Missing email and password
    });

    expect(response.status()).toBe(500); // Your API returns 500 for validation errors
  });

  test('should reject registration with invalid email format', async ({ apiContext }) => {
    const api = new ApiHelper(apiContext);
    const userData = {
      name: 'Test User',
      email: 'invalid-email',
      password: 'TestPassword123!',
    };

    const { response } = await api.register(userData);
    
    // This depends on your validation logic
    expect([400, 500]).toContain(response.status());
  });
});
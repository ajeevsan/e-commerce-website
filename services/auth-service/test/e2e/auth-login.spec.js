// test/e2e/auth-login.spec.js
const { test, expect } = require('./setup/test-setup');
const ApiHelper = require('./helpers/api-helper');
const TestDataHelper = require('./helpers/test-data');

test.describe('User Login API', () => {
  test.use({ dbCleanup: true });

  test('should login with valid credentials', async ({ apiContext }) => {
    const api = new ApiHelper(apiContext);
    const userData = TestDataHelper.generateUserData();

    // Register user first
    await api.register(userData);

    // Login with same credentials
    const { response, data } = await api.login({
      email: userData.email,
      password: userData.password,
    });

    expect(response.status(200));
    expect(data.message).toBe('Login successful');
    expect(data.name).toBe(userData.name);
    expect(data.userId).toBeDefined();
    expect(data.token).toBeDefined();
  });

  test('should reject login with invalid email', async ({ apiContext }) => {
    const api = new ApiHelper(apiContext);

    const { response, data } = await api.login({
      email: 'nonexistent@test.com',
      password: 'password123',
    });

    expect(response.status()).toBe(401);
    expect(data.msg).toBe('Invalid Credentials');
  });

  test('should reject login with invalid password', async ({ apiContext }) => {
    const api = new ApiHelper(apiContext);
    const userData = TestDataHelper.generateUserData();

    // Register user first
    await api.register(userData);

    // Login with wrong password
    const { response, data } = await api.login({
      email: userData.email,
      password: 'wrongpassword',
    });

    expect(response.status()).toBe(401);
    expect(data.msg).toBe('Invalid Credentials');
  });

  test('should reject login with missing credentials', async ({ apiContext }) => {
    const api = new ApiHelper(apiContext);

    const { response } = await api.login({
      email: 'test@test.com',
      // Missing password
    });

    expect([400, 500]).toContain(response.status());
  });
});
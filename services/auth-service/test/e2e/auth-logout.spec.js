// test/e2e/auth-logout.spec.js
const { test, expect } = require('./setup/test-setup');
const ApiHelper = require('./helpers/api-helper');
const TestDataHelper = require('./helpers/test-data');
const { redisClient } = require('../../config/cache');

test.describe('User Logout API', () => {
  test.use({ dbCleanup: true });

  test('should logout successfully with valid token', async ({ apiContext }) => {
    const api = new ApiHelper(apiContext);
    const userData = TestDataHelper.generateUserData();

    // Register and login user
    await api.register(userData);
    const { data: loginData } = await api.login({
      email: userData.email,
      password: userData.password,
    });

    // Logout
    const { response, data } = await api.logout(loginData.token);

    expect(response.status(200));
    expect(data.message).toBe('Logged out successfully');

    // Verify token is blacklisted
    const blacklisted = await redisClient.get(`blacklist:${loginData.token}`);
    expect(blacklisted).toBe('true');

    // Verify session is removed
    const session = await redisClient.get(`session:${loginData.userId}`);
    expect(session).toBeNull();
  });

  test('should reject logout without token', async ({ apiContext }) => {
    const api = new ApiHelper(apiContext);

    const response = await apiContext.post('http://localhost:3000/api/auth/logout');

    expect([401, 403, 500]).toContain(response.status());
  });
});
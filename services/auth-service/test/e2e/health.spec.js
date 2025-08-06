// test/e2e/health.spec.js
const { test, expect } = require('./setup/test-setup');
const ApiHelper = require('./helpers/api-helper');

test.describe('Health Check API', () => {
  test('should return health status', async ({ apiContext }) => {
    const api = new ApiHelper(apiContext);
    const { response, data } = await api.healthCheck();

    expect(response.status(200));
    expect(data.status).toBe('OK');
    expect(data.service).toBe('auth-service');
    expect(data.timestamp).toBeDefined();
  });
});
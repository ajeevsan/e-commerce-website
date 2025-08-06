const { test: baseTest, expect } = require('@playwright/test');

const test = baseTest.extend({
  apiContext: async ({ request }, use) => {
    await use(request);
  },
  
  dbCleanup: async ({}, use) => {
    await use();
    
    try {
      const User = require('../../../models/User');
      await User.deleteMany({ email: { $regex: /test.*@/ } });
      
      const { redisClient } = require('../../config/cache');
      const keys = await redisClient.keys('*test*');
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  },
});

module.exports = { test, expect };
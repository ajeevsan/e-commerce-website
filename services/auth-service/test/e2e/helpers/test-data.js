// test/e2e/helpers/test-data.js
const crypto = require('crypto');

class TestDataHelper {
  static generateUniqueEmail() {
    const timestamp = Date.now();
    const random = crypto.randomBytes(4).toString('hex');
    return `test.${timestamp}.${random}@playwright.test`;
  }

  static generateUserData() {
    return {
      name: 'Test User',
      email: this.generateUniqueEmail(),
      password: 'TestPassword123!',
    };
  }

  static generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}

module.exports = TestDataHelper;
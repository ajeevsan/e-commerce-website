// test/e2e/helpers/api-helper.js
class ApiHelper {
  constructor(request) {
    this.request = request;
    this.baseURL = 'http://localhost:3000/api/auth';
  }

  async register(userData) {
    const response = await this.request.post(`${this.baseURL}/register`, {
      data: userData,
    });
    return {
      response,
      data: await response.json().catch(() => ({})),
    };
  }

  async login(credentials) {
    const response = await this.request.post(`${this.baseURL}/login`, {
      data: credentials,
    });
    return {
      response,
      data: await response.json().catch(() => ({})),
    };
  }

  async sendOTP(email) {
    const response = await this.request.post(`${this.baseURL}/send-otp`, {
      data: { email },
    });
    return {
      response,
      data: await response.json().catch(() => ({})),
    };
  }

  async verifyOTP(otpData) {
    const response = await this.request.post(`${this.baseURL}/verify-otp`, {
      data: otpData,
    });
    return {
      response,
      data: await response.json().catch(() => ({})),
    };
  }

  async logout(token) {
    const response = await this.request.post(`${this.baseURL}/logout`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return {
      response,
      data: await response.json().catch(() => ({})),
    };
  }

  async healthCheck() {
    const response = await this.request.get('http://localhost:3000/health');
    return {
      response,
      data: await response.json().catch(() => ({})),
    };
  }
}

module.exports = ApiHelper;
// apiAuth.js - Updated to use API Gateway
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_GATEWAY_URL;

// Create axios instance with default config
const apiClient = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    }
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('authToken');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export const loginUser = async (data) => {
    const response = await apiClient.post('/auth/login', data);
    return response.data;
};

export const registerUser = async (data) => {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
};

export const sendOtp = async (data) => {
    console.log('send-otp_data___', data);
    const response = await apiClient.post('/auth/send-otp', data);
    return response.data;
};

export const verifyOtp = async (data) => {
    console.log('verify-otp_data___', data);
    const response = await apiClient.post('/auth/verify-otp', data);
    return response.data;
};
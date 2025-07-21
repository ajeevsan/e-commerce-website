import axios from 'axios';

const BASE_URL = import.meta.env.VITE_BASE_URL;

export const loginUser = async (data) => {
    const response = await axios.post(`${BASE_URL}/auth/login`, data);
    return response.data;
};

export const registerUser = async (data) => {
    const response = await axios.post(`${BASE_URL}/auth/register`, data);
    return response.data;
}

export const sendOtp = async (data) => {
    console.log('send-otp_data___', data)
    const response = await axios.post(`${BASE_URL}/auth/send-otp`, data);
    return response.data;
}

export const verifyOtp = async (data) => {
    console.log('send-otp_data___', data)
    const response = await axios.post(`${BASE_URL}/auth/verify-otp`, data);
    return response.data;
}


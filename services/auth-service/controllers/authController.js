// /service/authService/controller/authController.js

const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendEvent } = require('../kafka/kafkaProducer');
const { redisClient } = require('../config/cache');
const sendEmail = require('../utils/sendEmail')

exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if user exists
        const existing = await User.findOne({ email });
        if (existing) return res.status(400).json({ msg: 'User exists' });

        // Create User
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ name, email, password: hashedPassword });

        // Generate Token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1m' });

        //! Send user creation event to Kafka (non-blocking)
        sendEvent('auth-service', {
            event: 'USER_REGISTERED',
            userId: user._id.toString(),
            name: name,
            email: email,
            timestamp: new Date().toISOString()
        }).catch(error => {
            console.error('Failed to send registration event:', error);
            // Don't fail the request if Kafka is down
        });

        res.status(201).json({ message: 'User Registered Successfully', token });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.verifyOtp = async (req, res) => {
    const { email, otp, name, password } = req.body;
    try {
        let cachedData = await redisClient.get(`otp:${email}`);
        cachedData = JSON.parse(cachedData)
        let cachedOTP = cachedData.otp.toString()
        console.log(!cachedData)
        if (!cachedData || cachedOTP !== otp) {
            return res.status(400).json({ message: 'Invalid or expired OTP.' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ 
            success: false,
            message: 'User already exists.',
            data: null
        });

        await redisClient.del(`otp:${email}`); // Cleanup
        res.status(201).json({
            success: true,
            message: 'User registered successfully.',
            data: null
        });
    } catch (err) {
        res.status(500).json({ message: 'Registration failed.', error: err.message });
    }
}

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            console.log('Invalid login attempt for email:', email);
            return res.status(401).json({ msg: 'Invalid Credentials' });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });

        //! Store session in Redis
        await redisClient.set(`session:${user._id}`, JSON.stringify({
            userId: user._id,
            email: user.email,
            loginTime: new Date().toISOString()
        }), 86400); // 24 hours

        //! Send login event to Kafka (non-blocking)
        sendEvent('auth-service', {
            event: 'USER_LOGIN',
            userId: user._id.toString(),
            email: email,
            timestamp: new Date().toISOString()
        }).then(() => console.log('login succesfully.')).catch(error => {
            console.error('Failed to send login event:', error);
            //! Don't fail the request if Kafka is down
        });

        return res.status(200).json({
            message: 'Login successful',
            name: user.name,
            userId: user._id,
            token
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.sendOtp = async (req, res) => {
    try {
        const { email } = req.body;
        const otp = Math.floor(100000 + Math.random() * 900000);
        //! Store session in Redis
        await redisClient.set(`otp:${email}`, JSON.stringify({
            otp,
            loginTime: new Date().toISOString()
        }), 300); //5 min

        // sendEvent('auth-service', {
        //     event: 'SEND_OTP',
        //     otp: otp,
        //     email: email,
        //     timestamp: new Date().toISOString()
        // }).then(() => console.log('Otp send succesfully.')).catch(err => console.error('Failed to send the send otp event:', err))

        await sendEmail(email, `Your OTP is ${otp}`);

        res.status(200).json({ message: 'OTP sent to email.' });
    } catch (err) {
        res.status(500).json({ message: 'Error sending OTP', error: err.message });
    }
}

exports.logout = async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        const userId = req.user.id;

        // Add token to blacklist
        await redisClient.set(`blacklist:${token}`, 'true', 86400);

        // Remove session
        await redisClient.del(`session:${userId}`);

        // Send logout event to Kafka (non-blocking)
        sendEvent('auth-service', {
            event: 'USER_LOGOUT',
            userId: userId.toString(),
            timestamp: new Date().toISOString()
        }).catch(error => {
            console.error('Failed to send logout event:', error);
            // Don't fail the request if Kafka is down
        });

        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Logout failed' });
    }
};
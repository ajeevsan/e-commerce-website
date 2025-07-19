const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendEvent } = require('../kafka/kafkaProducer');
const { redisClient } = require('../config/cache');

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
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });

        // Send user creation event to Kafka (non-blocking)
        sendEvent('user-events', {
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

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        
        if (!user || !(await bcrypt.compare(password, user.password))) {
            console.log('Invalid login attempt for email:', email);
            return res.status(401).json({ msg: 'Invalid Credentials' });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });

        // Store session in Redis
        await redisClient.set(`session:${user._id}`, JSON.stringify({
            userId: user._id,
            email: user.email,
            loginTime: new Date().toISOString()
        }), 86400); // 24 hours

        // Send login event to Kafka (non-blocking)
        sendEvent('user-events', {
            event: 'USER_LOGIN',
            userId: user._id.toString(),
            email: email,
            timestamp: new Date().toISOString()
        }).catch(error => {
            console.error('Failed to send login event:', error);
            // Don't fail the request if Kafka is down
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

exports.logout = async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        const userId = req.user.id;

        // Add token to blacklist
        await redisClient.set(`blacklist:${token}`, 'true', 86400);

        // Remove session
        await redisClient.del(`session:${userId}`);

        // Send logout event to Kafka (non-blocking)
        sendEvent('user-events', {
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
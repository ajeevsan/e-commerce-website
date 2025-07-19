// services/authEventHandlers.js
const { redisClient } = require('../config/cache');

// Handle user registration events (could be from other services)
const handleUserRegistration = async (eventData) => {
    try {
        console.log('Processing user registration event:', eventData);
        
        // You can add additional processing here
        // For example: send welcome email, create user profile, etc.
        
        // Cache user data for quick access
        if (eventData.userId) {
            await redisClient.set(
                `user:${eventData.userId}`, 
                JSON.stringify(eventData), 
                3600 // 1 hour
            );
        }
        
        console.log('User registration event processed successfully');
    } catch (error) {
        console.error('Error processing user registration event:', error);
        throw error;
    }
};

// Handle user login events
const handleUserLogin = async (eventData) => {
    try {
        console.log('Processing user login event:', eventData);
        
        // Update last login time, analytics, etc.
        if (eventData.userId) {
            await redisClient.set(
                `last_login:${eventData.userId}`, 
                eventData.timestamp, 
                86400 // 24 hours
            );

            // You could also track login count
            const loginCount = await redisClient.get(`login_count:${eventData.userId}`);
            const newCount = loginCount ? parseInt(loginCount) + 1 : 1;
            await redisClient.set(
                `login_count:${eventData.userId}`, 
                newCount.toString(), 
                86400 * 30 // 30 days
            );
        }
        
        console.log('User login event processed successfully');
    } catch (error) {
        console.error('Error processing user login event:', error);
        throw error;
    }
};

// Handle user logout events
const handleUserLogout = async (eventData) => {
    try {
        console.log('Processing user logout event:', eventData);
        
        // Update user status, cleanup, etc.
        if (eventData.userId) {
            await redisClient.set(
                `last_logout:${eventData.userId}`, 
                eventData.timestamp, 
                86400 // 24 hours
            );
        }
        
        console.log('User logout event processed successfully');
    } catch (error) {
        console.error('Error processing user logout event:', error);
        throw error;
    }
};

// Handle password reset events (from other services)
const handlePasswordReset = async (eventData) => {
    try {
        console.log('Processing password reset event:', eventData);
        
        // Invalidate all sessions for the user
        if (eventData.userId) {
            // Remove user session
            await redisClient.del(`session:${eventData.userId}`);
            
            // You might also want to invalidate specific tokens
            // This would require keeping track of active tokens
            
            // Log the password reset for security audit
            await redisClient.set(
                `password_reset:${eventData.userId}`, 
                eventData.timestamp, 
                86400 * 7 // Keep for 7 days for audit
            );
        }
        
        console.log('Password reset event processed successfully');
    } catch (error) {
        console.error('Error processing password reset event:', error);
        throw error;
    }
};

module.exports = {
    handleUserRegistration,
    handleUserLogin,
    handleUserLogout,
    handlePasswordReset
};
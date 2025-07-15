const jwt = require('jsonwebtoken')

const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        //! Get token from header
        if(!authHeader){
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.',
                data: null
            });
        }

        //! CHeck if token start from 'Bearer
        if(!authHeader.startsWith('Bearer ')){
            return res.status(401).json({
                success: false,
                message: 'Access denied. Invalid token format.',
                data: null
            })
        }

        //! Extract token
        const token = authHeader.substring(7)

        if(!token){
            return res.status(401).json({
                success: false,
                massage: "Access denied. No token provided.",
                data: null
            })
        }

        //! verify token 
        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        //! add user info to request object
        req.user = decoded
        next()
    } catch (error) {
        console.error('Auth middleware error: ', error.message)

        if(error.name === 'TokenExpiredError'){
            return res.status(401).json({
                success: false,
                message: 'Token expired!',
                data: null
            })
        }

        if(error.name === 'JsonWebTokenError'){
            return res.status(401).json({
                success: false,
                message: 'Invalid token.',
                data: null
            })
        }

        return res.status(500).json({
            success: false,
            message: 'Server error during authentication', 
            data: null
        })
    }
};


module.exports = authMiddleware
const express = require('express')
const router = express.Router()
const { 
    getAllProducts, 
    getFeaturedProducts, 
    getCategories, 
    getOffers, 
    getCategoryData, 
    getProductById 
} = require('../controllers/productController')
const rateLimit = require('express-rate-limit')

const productLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 50,
    message: 'Too many requests for product data. Please try again later.'
})

// Routes
router.get('/all', getAllProducts)
router.get('/featured', getFeaturedProducts)
router.get('/categories', getCategories)
router.get('/offers', getOffers)
router.get('/category/:category', getCategoryData)
router.get('/:id', productLimiter, getProductById) // Changed from '/product/:id' to '/:id'

module.exports = router
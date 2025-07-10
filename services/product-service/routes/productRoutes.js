const express = require('express')
const router = express.Router()
const { getAllProducts, getFeaturedProducts, getCategories, getOffers, getCategoryData, getProductById } = require('../controllers/productController')
const rateLimit = require('express-rate-limit')


const productLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 50,
    message: 'Too many requests for product data. Please try again later.'
})

router.get('/all', productLimiter, getAllProducts)
router.get('/featured', productLimiter, getFeaturedProducts)
router.get('/categories', productLimiter, getCategories)
router.get('/offers', productLimiter, getOffers)
router.get('/category/:category', productLimiter, getCategoryData)
router.get('/product/:id', productLimiter, getProductById)


module.exports= router
const express = require('express')
const router = express.Router()
const { getAllProducts, getFeaturedProducts, getCategories, getOffers  } = require('../controllers/productController')

router.get('/', getAllProducts)
router.get('/featured', getFeaturedProducts)
router.get('/categories', getCategories)
router.get('/offers', getOffers)

module.exports= router
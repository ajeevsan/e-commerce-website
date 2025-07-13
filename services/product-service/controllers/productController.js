const axios = require('axios')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const logger = require('../config/logger')

//! Creating a basic schema 
const productSchema = new mongoose.Schema({}, {strict: false})

//!create the model
const Product = mongoose.model('Product', productSchema)

// Category mapping for DummyJSON API
const categoryMapping = {
  'men': 'mens-shirts',
  'women': 'womens-dresses',
  'unisex': 'tops',
  'smartphones': 'smartphones',
  'laptops': 'laptops',
  'tablets': 'tablets',
  'mobile-accessories': 'mobile-accessories',
  'furniture': 'furniture',
  'home-decoration': 'home-decoration',
  'kitchen-accessories': 'kitchen-accessories',
  'groceries': 'groceries',
  'skin-care': 'skin-care',
  'beauty': 'beauty',
  'fragrances': 'fragrances',
  'motorcycle': 'motorcycle',
  'vehicle': 'vehicle',
  'sports-accessories': 'sports-accessories'
};

//! middleware to check jwt token
const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    console.log('authHeader___', !authHeader)

    logger.debug('Token verification attempt', { 
      correlationId: req.correlationId,
      hasAuthHeader: !!authHeader,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });

    if(!authHeader || !authHeader.startsWith('Bearer ')){
      logger.warn('Access denied - Invalid or missing token', {
        correlationId: req.correlationId,
        authHeader: authHeader ? 'present but invalid format' : 'missing',
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      return res.status(401).json({
        success: false,
        message: 'Access denied. Invalid token provided or no token provided',
        data: null
      })
    }

    const token = authHeader.substring(7)
    console.log("token___", token)

    if(!token){
      logger.warn('Access denied - No token provided after Bearer', {
        correlationId: req.correlationId,
        ip: req.ip
      });

      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
        data: null
      })
    }

    //! verify token 
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
	  console.log('decoded_value___', decoded)
    req.user = decoded;
    
    logger.info('Token verified successfully', {
      correlationId: req.correlationId,
      userId: decoded.id || decoded.userId,
      userEmail: decoded.email,
      tokenExp: new Date(decoded.exp * 1000).toISOString()
    });

    next()
  } catch (error) {
    logger.error('Token verification failed', {
      error: error.message,
      errorType: error.name,
      correlationId: req.correlationId,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    if(error.name === 'TokenExpiredError'){
      return res.status(401).json({
        success: false,
        message: 'Token expired!!!', 
        data: null
      })
    } else if(error.name === 'JsonWebTokenError'){
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
        data: null
      })
    } else {
      return res.status(401).json({
        success: false,
        message: 'Token Verification failed',
        data: null
      })
    }
  }
}

//! API to get all the products data based on their categories.
exports.getCategoryData = [verifyToken, async (req, res) => {
  try {
    const { category } = req.params
    const { page = 1, limit = 20, search = '' } = req.query

    logger.info('Fetching category data', {
      correlationId: req.correlationId,
      userId: req.user.id || req.user.userId,
      category: category,
      page: page,
      limit: limit,
      search: search
    });

    const apiCategoryData = categoryMapping[category.toLowerCase()] || category;
    const allMongoCategoryData = await Product.find({ category : apiCategoryData})

    if (!allMongoCategoryData || allMongoCategoryData.length === 0) {
      logger.warn('No products found for category', {
        correlationId: req.correlationId,
        category: category,
        apiCategoryData: apiCategoryData,
        userId: req.user.id || req.user.userId
      });

      return res.status(404).json({
        success: false,
        message: 'No products found for this category',
        data: null
      });
    }

    //! Filter by search if provided and not using search endpoint
    let filteredProducts = allMongoCategoryData;

    //! Implement Pagination
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedProducts = allMongoCategoryData.slice(startIndex, endIndex)

    //! Calculate Paginate info
    const totalProducts = filteredProducts.length;
    const totalPages = Math.ceil(totalProducts / limit);

    logger.info('Category data fetched successfully', {
      correlationId: req.correlationId,
      userId: req.user.id || req.user.userId,
      category: category,
      totalProducts: totalProducts,
      returnedProducts: paginatedProducts.length,
      currentPage: parseInt(page),
      totalPages: totalPages
    });

    res.status(200).json({
      success: true,
      message: 'Products data fetched succesfully',
      data: {
        products: paginatedProducts,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          hasNextPage: endIndex < totalProducts,
          hasPreviousPage: page > 1,
          limit: parseInt(limit)
        },
        category: category,
        searchTerm: search || null
      }
    });

  } catch (error) {
    logger.error('Error fetching category data', {
      error: error.message,
      stack: error.stack,
      correlationId: req.correlationId,
      userId: req.user?.id || req.user?.userId,
      category: req.params.category,
      query: req.query
    });

    if (error.response?.status === 404) {
      return res.status(404).json({
        success: false,
        message: 'Category is not found or no products available',
        data: null
      })
    }

    if (error.code === 'ECONNABORTED') {
      return res.status(408).json({
        success: false,
        message: 'Request Timeout, Please try again.',
        data: null
      })
    }

    res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      data: null,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}]

//! APi to get all products 
exports.getAllProducts = [verifyToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    
    logger.info('Fetching all products', {
      correlationId: req.correlationId,
      userId: req.user.id || req.user.userId,
      page: page,
      limit: limit,
      search: search
    });

    let allProducts = await Product.find({})
    
    const products = allProducts || []

    //! Implement Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit)
    const paginatedProducts = products.slice(startIndex, endIndex)

    logger.info('All products fetched successfully', {
      correlationId: req.correlationId,
      userId: req.user.id || req.user.userId,
      totalProducts: products.length,
      returnedProducts: paginatedProducts.length,
      currentPage: parseInt(page),
      totalPages: Math.ceil(products.length / limit)
    });

    res.status(200).json({
      success: true,
      message: 'All Products fetched succesfully',
      data: {
        products: paginatedProducts,
        pagination: {
          currentPage: parseInt(page),
          totalProducts: products.length,
          totalPages: Math.ceil(products.length / limit),
          hasNextPage: endIndex < products.length,
          hasPreviousPage: page > 1,
          limit: parseInt(limit)
        }
      },
      searchTerm: search || null
    })
  } catch (error) {
    logger.error('Error fetching all products', {
      error: error.message,
      stack: error.stack,
      correlationId: req.correlationId,
      userId: req.user?.id || req.user?.userId,
      query: req.query
    });

    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      data: null
    })
  }
}]

//! API to get featured products
exports.getFeaturedProducts = [verifyToken, async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    logger.info('Fetching featured products', {
      correlationId: req.correlationId,
      userId: req.user.id || req.user.userId,
      limit: limit
    });

    const response = await axios.get('https://dummyjson.com/products', {
      timeout: 10000,
    });

    const products = response.data.products || [];

    // Filter featured products (high rating or specific criteria)
    const featuredProducts = products
      .filter(product => product.rating >= 4.5)
      .slice(0, parseInt(limit));

    logger.info('Featured products fetched successfully', {
      correlationId: req.correlationId,
      userId: req.user.id || req.user.userId,
      totalAvailableProducts: products.length,
      featuredProductsCount: featuredProducts.length,
      requestedLimit: parseInt(limit)
    });

    res.status(200).json({
      success: true,
      message: 'Featured products fetched successfully',
      data: {
        products: featuredProducts,
        count: featuredProducts.length
      }
    });

  } catch (error) {
    logger.error('Error fetching featured products', {
      error: error.message,
      stack: error.stack,
      correlationId: req.correlationId,
      userId: req.user?.id || req.user?.userId,
      query: req.query
    });

    res.status(500).json({
      success: false,
      message: 'Failed to fetch featured products',
      data: null
    });
  }
}]

//! API to get all categories
exports.getCategories = [verifyToken, async (req, res) => {
  try {
    logger.info('Fetching categories', {
      correlationId: req.correlationId,
      userId: req.user.id || req.user.userId
    });

    const response = await axios.get('https://dummyjson.com/products/categories', {
      timeout: 10000,
    });

    logger.info('Categories fetched successfully', {
      correlationId: req.correlationId,
      userId: req.user.id || req.user.userId,
      categoriesCount: response.data.length
    });

    res.status(200).json({
      success: true,
      message: 'Categories fetched successfully',
      data: {
        categories: response.data,
        count: response.data.length
      }
    });

  } catch (error) {
    logger.error('Error fetching categories', {
      error: error.message,
      stack: error.stack,
      correlationId: req.correlationId,
      userId: req.user?.id || req.user?.userId
    });

    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      data: null
    });
  }
}]

//! API to get offers/discounted products
exports.getOffers = [verifyToken, async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    logger.info('Fetching offers', {
      correlationId: req.correlationId,
      userId: req.user.id || req.user.userId,
      limit: limit
    });

    const response = await axios.get('https://dummyjson.com/products', {
      timeout: 10000,
    });

    const products = response.data.products || [];

    // Filter products with discounts
    const discountedProducts = products
      .filter(product => product.discountPercentage > 0)
      .sort((a, b) => b.discountPercentage - a.discountPercentage)
      .slice(0, parseInt(limit));

    logger.info('Offers fetched successfully', {
      correlationId: req.correlationId,
      userId: req.user.id || req.user.userId,
      totalProducts: products.length,
      discountedProductsCount: discountedProducts.length,
      requestedLimit: parseInt(limit),
      maxDiscountPercentage: discountedProducts.length > 0 ? discountedProducts[0].discountPercentage : 0
    });

    res.status(200).json({
      success: true,
      message: 'Offers fetched successfully',
      data: {
        products: discountedProducts,
        count: discountedProducts.length
      }
    });

  } catch (error) {
    logger.error('Error fetching offers', {
      error: error.message,
      stack: error.stack,
      correlationId: req.correlationId,
      userId: req.user?.id || req.user?.userId,
      query: req.query
    });

    res.status(500).json({
      success: false,
      message: 'Failed to fetch offers',
      data: null
    });
  }
}]

//! API to get single product by ID
exports.getProductById = [verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    logger.info('Fetching product by ID', {
      correlationId: req.correlationId,
      userId: req.user.id || req.user.userId,
      productId: id
    });

    const response = await axios.get(`https://dummyjson.com/products/${id}`, {
      timeout: 10000,
    });

    logger.info('Product fetched successfully', {
      correlationId: req.correlationId,
      userId: req.user.id || req.user.userId,
      productId: id,
      productTitle: response.data.title,
      productCategory: response.data.category,
      productPrice: response.data.price
    });

    res.status(200).json({
      success: true,
      message: 'Product fetched successfully',
      data: response.data
    });

  } catch (error) {
    logger.error('Error fetching product by ID', {
      error: error.message,
      stack: error.stack,
      correlationId: req.correlationId,
      userId: req.user?.id || req.user?.userId,
      productId: req.params.id,
      responseStatus: error.response?.status,
      responseData: error.response?.data
    });

    if (error.response?.status === 404) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
        data: null
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to fetch product',
      data: null
    });
  }
}]
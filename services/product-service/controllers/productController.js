const axios = require('axios')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const logger = require('../config/logger')
const kafkaClient = require('../kafka/kafkaClient') 
const {redisClient} = require('../config/cache')

//! Creating a basic schema 
const productSchema = new mongoose.Schema({}, {strict: false})

//! Create the model
const Product = mongoose.model('Product', productSchema)

//! Category mapping for DummyJSON API
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

//! Redis cache helper functions
const getCacheKey = (prefix, ...args) => {
  return `${prefix}:${args.join(':')}`;
};

const getCachedData = async (key) => {
  try {
    const cachedData = await redisClient.get(key);
    if (cachedData) {
      return JSON.parse(cachedData);
    }
    return null;
  } catch (error) {
    logger.error('Redis get error', { error: error.message, key });
    return null;
  }
};

const setCachedData = async (key, data, expiration = 300) => {
  try {
    await redisClient.setEx(key, expiration, JSON.stringify(data));
  } catch (error) {
    logger.error('Redis set error', { error: error.message, key });
  }
};

const deleteCachedData = async (pattern) => {
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(...keys);
    }
  } catch (error) {
    logger.error('Redis delete error', { error: error.message, pattern });
  }
};

//! Kafka event helper functions
const sendKafkaEvent = async (eventType, eventData, correlationId, userId) => {
  try {
    await kafkaClient.sendProductEvent(eventType, {
      ...eventData,
      correlationId,
      userId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to send Kafka event', {
      error: error.message,
      eventType,
      correlationId,
      userId
    });
  }
};

//! Middleware to check jwt token
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

    //! Verify token 
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

    // Send Kafka event for category request
    await sendKafkaEvent('CATEGORY_REQUEST', {
      category,
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      action: 'fetch_category_data'
    }, req.correlationId, req.user.id || req.user.userId);

    // Create cache key for category data
    const cacheKey = getCacheKey('category', category, page, limit, search);
    
    // Try to get cached data
    const cachedData = await getCachedData(cacheKey);
    if (cachedData) {
      logger.info('Category data served from cache', {
        correlationId: req.correlationId,
        userId: req.user.id || req.user.userId,
        category: category,
        cacheKey: cacheKey
      });

      // Send Kafka event for cache hit
      await sendKafkaEvent('CATEGORY_CACHE_HIT', {
        category,
        cacheKey,
        action: 'cache_hit'
      }, req.correlationId, req.user.id || req.user.userId);
      
      return res.status(200).json({
        success: true,
        message: 'Products data fetched successfully (cached)',
        data: cachedData,
        fromCache: true
      });
    }

    const apiCategoryData = categoryMapping[category.toLowerCase()] || category;
    const allMongoCategoryData = await Product.find({ category : apiCategoryData})

    if (!allMongoCategoryData || allMongoCategoryData.length === 0) {
      logger.warn('No products found for category', {
        correlationId: req.correlationId,
        category: category,
        apiCategoryData: apiCategoryData,
        userId: req.user.id || req.user.userId
      });

      // Send Kafka event for category not found
      await sendKafkaEvent('CATEGORY_NOT_FOUND', {
        category,
        apiCategoryData,
        action: 'category_not_found'
      }, req.correlationId, req.user.id || req.user.userId);

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

    const responseData = {
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
    };

    // Cache the response data for 5 minutes
    await setCachedData(cacheKey, responseData, 300);

    logger.info('Category data fetched successfully', {
      correlationId: req.correlationId,
      userId: req.user.id || req.user.userId,
      category: category,
      totalProducts: totalProducts,
      returnedProducts: paginatedProducts.length,
      currentPage: parseInt(page),
      totalPages: totalPages,
      cached: true
    });

    // Send Kafka event for successful category fetch
    await sendKafkaEvent('CATEGORY_FETCH_SUCCESS', {
      category,
      totalProducts,
      returnedProducts: paginatedProducts.length,
      currentPage: parseInt(page),
      totalPages,
      action: 'fetch_success'
    }, req.correlationId, req.user.id || req.user.userId);

    res.status(200).json({
      success: true,
      message: 'Products data fetched successfully',
      data: responseData,
      fromCache: false
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

    // Send Kafka event for category fetch error
    await sendKafkaEvent('CATEGORY_FETCH_ERROR', {
      category: req.params.category,
      error: error.message,
      action: 'fetch_error'
    }, req.correlationId, req.user?.id || req.user?.userId);

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

//! API to get all products 
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

    // Send Kafka event for all products request
    await sendKafkaEvent('ALL_PRODUCTS_REQUEST', {
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      action: 'fetch_all_products'
    }, req.correlationId, req.user.id || req.user.userId);

    // Create cache key for all products
    const cacheKey = getCacheKey('all-products', page, limit, search);
    
    // Try to get cached data
    const cachedData = await getCachedData(cacheKey);
    if (cachedData) {
      logger.info('All products served from cache', {
        correlationId: req.correlationId,
        userId: req.user.id || req.user.userId,
        cacheKey: cacheKey
      });

      // Send Kafka event for cache hit
      await sendKafkaEvent('ALL_PRODUCTS_CACHE_HIT', {
        cacheKey,
        action: 'cache_hit'
      }, req.correlationId, req.user.id || req.user.userId);
      
      return res.status(200).json({
        success: true,
        message: 'All Products fetched successfully (cached)',
        data: cachedData,
        searchTerm: search || null,
        fromCache: true
      });
    }

    let allProducts = await Product.find({})
    
    const products = allProducts || []

    //! Implement Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit)
    const paginatedProducts = products.slice(startIndex, endIndex)

    const responseData = {
      products: paginatedProducts,
      pagination: {
        currentPage: parseInt(page),
        totalProducts: products.length,
        totalPages: Math.ceil(products.length / limit),
        hasNextPage: endIndex < products.length,
        hasPreviousPage: page > 1,
        limit: parseInt(limit)
      }
    };

    // Cache the response data for 5 minutes
    await setCachedData(cacheKey, responseData, 300);

    logger.info('All products fetched successfully', {
      correlationId: req.correlationId,
      userId: req.user.id || req.user.userId,
      totalProducts: products.length,
      returnedProducts: paginatedProducts.length,
      currentPage: parseInt(page),
      totalPages: Math.ceil(products.length / limit),
      cached: true
    });

    // Send Kafka event for successful all products fetch
    await sendKafkaEvent('ALL_PRODUCTS_FETCH_SUCCESS', {
      totalProducts: products.length,
      returnedProducts: paginatedProducts.length,
      currentPage: parseInt(page),
      totalPages: Math.ceil(products.length / limit),
      action: 'fetch_success'
    }, req.correlationId, req.user.id || req.user.userId);

    res.status(200).json({
      success: true,
      message: 'All Products fetched successfully',
      data: responseData,
      searchTerm: search || null,
      fromCache: false
    })
  } catch (error) {
    logger.error('Error fetching all products', {
      error: error.message,
      stack: error.stack,
      correlationId: req.correlationId,
      userId: req.user?.id || req.user?.userId,
      query: req.query
    });

    // Send Kafka event for all products fetch error
    await sendKafkaEvent('ALL_PRODUCTS_FETCH_ERROR', {
      error: error.message,
      action: 'fetch_error'
    }, req.correlationId, req.user?.id || req.user?.userId);

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

    // Send Kafka event for featured products request
    await sendKafkaEvent('FEATURED_PRODUCTS_REQUEST', {
      limit: parseInt(limit),
      action: 'fetch_featured_products'
    }, req.correlationId, req.user.id || req.user.userId);

    // Create cache key for featured products
    const cacheKey = getCacheKey('featured-products', limit);
    
    // Try to get cached data
    const cachedData = await getCachedData(cacheKey);
    if (cachedData) {
      logger.info('Featured products served from cache', {
        correlationId: req.correlationId,
        userId: req.user.id || req.user.userId,
        cacheKey: cacheKey
      });

      // Send Kafka event for cache hit
      await sendKafkaEvent('FEATURED_PRODUCTS_CACHE_HIT', {
        cacheKey,
        action: 'cache_hit'
      }, req.correlationId, req.user.id || req.user.userId);
      
      return res.status(200).json({
        success: true,
        message: 'Featured products fetched successfully (cached)',
        data: cachedData,
        fromCache: true
      });
    }

    const response = await axios.get('https://dummyjson.com/products', {
      timeout: 10000,
    });

    const products = response.data.products || [];

    // Filter featured products (high rating or specific criteria)
    const featuredProducts = products
      .filter(product => product.rating >= 4.5)
      .slice(0, parseInt(limit));

    const responseData = {
      products: featuredProducts,
      count: featuredProducts.length
    };

    // Cache the response data for 10 minutes
    await setCachedData(cacheKey, responseData, 600);

    logger.info('Featured products fetched successfully', {
      correlationId: req.correlationId,
      userId: req.user.id || req.user.userId,
      totalAvailableProducts: products.length,
      featuredProductsCount: featuredProducts.length,
      requestedLimit: parseInt(limit),
      cached: true
    });

    // Send Kafka event for successful featured products fetch
    await sendKafkaEvent('FEATURED_PRODUCTS_FETCH_SUCCESS', {
      totalAvailableProducts: products.length,
      featuredProductsCount: featuredProducts.length,
      requestedLimit: parseInt(limit),
      action: 'fetch_success'
    }, req.correlationId, req.user.id || req.user.userId);

    res.status(200).json({
      success: true,
      message: 'Featured products fetched successfully',
      data: responseData,
      fromCache: false
    });

  } catch (error) {
    logger.error('Error fetching featured products', {
      error: error.message,
      stack: error.stack,
      correlationId: req.correlationId,
      userId: req.user?.id || req.user?.userId,
      query: req.query
    });

    // Send Kafka event for featured products fetch error
    await sendKafkaEvent('FEATURED_PRODUCTS_FETCH_ERROR', {
      error: error.message,
      action: 'fetch_error'
    }, req.correlationId, req.user?.id || req.user?.userId);

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

    // Send Kafka event for categories request
    await sendKafkaEvent('CATEGORIES_REQUEST', {
      action: 'fetch_categories'
    }, req.correlationId, req.user.id || req.user.userId);

    // Create cache key for categories
    const cacheKey = getCacheKey('categories');
    
    // Try to get cached data
    const cachedData = await getCachedData(cacheKey);
    if (cachedData) {
      logger.info('Categories served from cache', {
        correlationId: req.correlationId,
        userId: req.user.id || req.user.userId,
        cacheKey: cacheKey
      });

      // Send Kafka event for cache hit
      await sendKafkaEvent('CATEGORIES_CACHE_HIT', {
        cacheKey,
        action: 'cache_hit'
      }, req.correlationId, req.user.id || req.user.userId);
      
      return res.status(200).json({
        success: true,
        message: 'Categories fetched successfully (cached)',
        data: cachedData,
        fromCache: true
      });
    }

    const response = await axios.get('https://dummyjson.com/products/categories', {
      timeout: 10000,
    });

    const responseData = {
      categories: response.data,
      count: response.data.length
    };

    // Cache the response data for 30 minutes (categories don't change frequently)
    await setCachedData(cacheKey, responseData, 1800);

    logger.info('Categories fetched successfully', {
      correlationId: req.correlationId,
      userId: req.user.id || req.user.userId,
      categoriesCount: response.data.length,
      cached: true
    });

    // Send Kafka event for successful categories fetch
    await sendKafkaEvent('CATEGORIES_FETCH_SUCCESS', {
      categoriesCount: response.data.length,
      action: 'fetch_success'
    }, req.correlationId, req.user.id || req.user.userId);

    res.status(200).json({
      success: true,
      message: 'Categories fetched successfully',
      data: responseData,
      fromCache: false
    });

  } catch (error) {
    logger.error('Error fetching categories', {
      error: error.message,
      stack: error.stack,
      correlationId: req.correlationId,
      userId: req.user?.id || req.user?.userId
    });

    // Send Kafka event for categories fetch error
    await sendKafkaEvent('CATEGORIES_FETCH_ERROR', {
      error: error.message,
      action: 'fetch_error'
    }, req.correlationId, req.user?.id || req.user?.userId);

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

    // Send Kafka event for offers request
    await sendKafkaEvent('OFFERS_REQUEST', {
      limit: parseInt(limit),
      action: 'fetch_offers'
    }, req.correlationId, req.user.id || req.user.userId);

    // Create cache key for offers
    const cacheKey = getCacheKey('offers', limit);
    
    // Try to get cached data
    const cachedData = await getCachedData(cacheKey);
    if (cachedData) {
      logger.info('Offers served from cache', {
        correlationId: req.correlationId,
        userId: req.user.id || req.user.userId,
        cacheKey: cacheKey
      });

      // Send Kafka event for cache hit
      await sendKafkaEvent('OFFERS_CACHE_HIT', {
        cacheKey,
        action: 'cache_hit'
      }, req.correlationId, req.user.id || req.user.userId);
      
      return res.status(200).json({
        success: true,
        message: 'Offers fetched successfully (cached)',
        data: cachedData,
        fromCache: true
      });
    }

    const response = await axios.get('https://dummyjson.com/products', {
      timeout: 10000,
    });

    const products = response.data.products || [];

    // Filter products with discounts
    const discountedProducts = products
      .filter(product => product.discountPercentage > 0)
      .sort((a, b) => b.discountPercentage - a.discountPercentage)
      .slice(0, parseInt(limit));

    const responseData = {
      products: discountedProducts,
      count: discountedProducts.length
    };

    // Cache the response data for 5 minutes (offers might change frequently)
    await setCachedData(cacheKey, responseData, 300);

    logger.info('Offers fetched successfully', {
      correlationId: req.correlationId,
      userId: req.user.id || req.user.userId,
      totalProducts: products.length,
      discountedProductsCount: discountedProducts.length,
      requestedLimit: parseInt(limit),
      maxDiscountPercentage: discountedProducts.length > 0 ? discountedProducts[0].discountPercentage : 0,
      cached: true
    });

    // Send Kafka event for successful offers fetch
    await sendKafkaEvent('OFFERS_FETCH_SUCCESS', {
      totalProducts: products.length,
      discountedProductsCount: discountedProducts.length,
      requestedLimit: parseInt(limit),
      maxDiscountPercentage: discountedProducts.length > 0 ? discountedProducts[0].discountPercentage : 0,
      action: 'fetch_success'
    }, req.correlationId, req.user.id || req.user.userId);

    res.status(200).json({
      success: true,
      message: 'Offers fetched successfully',
      data: responseData,
      fromCache: false
    });

  } catch (error) {
    logger.error('Error fetching offers', {
      error: error.message,
      stack: error.stack,
      correlationId: req.correlationId,
      userId: req.user?.id || req.user?.userId,
      query: req.query
    });

    // Send Kafka event for offers fetch error
    await sendKafkaEvent('OFFERS_FETCH_ERROR', {
      error: error.message,
      action: 'fetch_error'
    }, req.correlationId, req.user?.id || req.user?.userId);

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

    // Send Kafka event for product by ID request
    await sendKafkaEvent('PRODUCT_BY_ID_REQUEST', {
      productId: id,
      action: 'fetch_product_by_id'
    }, req.correlationId, req.user.id || req.user.userId);

    // Create cache key for single product
    const cacheKey = getCacheKey('product', id);
    
    // Try to get cached data
    const cachedData = await getCachedData(cacheKey);
    if (cachedData) {
      logger.info('Product served from cache', {
        correlationId: req.correlationId,
        userId: req.user.id || req.user.userId,
        productId: id,
        cacheKey: cacheKey
      });

      // Send Kafka event for cache hit
      await sendKafkaEvent('PRODUCT_BY_ID_CACHE_HIT', {
        productId: id,
        cacheKey,
        action: 'cache_hit'
      }, req.correlationId, req.user.id || req.user.userId);
      
      return res.status(200).json({
        success: true,
        message: 'Product fetched successfully (cached)',
        data: cachedData,
        fromCache: true
      });
    }

    const response = await axios.get(`https://dummyjson.com/products/${id}`, {
      timeout: 10000,
    });

    // Cache the response data for 15 minutes
    await setCachedData(cacheKey, response.data, 900);

    logger.info('Product fetched successfully', {
      correlationId: req.correlationId,
      userId: req.user.id || req.user.userId,
      productId: id,
      productTitle: response.data.title,
      productCategory: response.data.category,
      productPrice: response.data.price,
      cached: true
    });

    // Send Kafka event for successful product fetch
    await sendKafkaEvent('PRODUCT_BY_ID_FETCH_SUCCESS', {
      productId: id,
      productTitle: response.data.title,
      productCategory: response.data.category,
      productPrice: response.data.price,
      action: 'fetch_success'
    }, req.correlationId, req.user.id || req.user.userId);

    res.status(200).json({
      success: true,
      message: 'Product fetched successfully',
      data: response.data,
      fromCache: false
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

    // Send Kafka event for product by ID fetch error
    await sendKafkaEvent('PRODUCT_BY_ID_FETCH_ERROR', {
      productId: req.params.id,
      error: error.message,
      responseStatus: error.response?.status,
      action: 'fetch_error'
    }, req.correlationId, req.user?.id || req.user?.userId);

    if (error.response?.status === 404) {
      // Send specific Kafka event for product not found
      await sendKafkaEvent('PRODUCT_NOT_FOUND', {
        productId: req.params.id,
        action: 'product_not_found'
      }, req.correlationId, req.user?.id || req.user?.userId);

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

//! API to clear cache (utility function for development/admin)
exports.clearCache = [verifyToken, async (req, res) => {
  try {
    const { pattern = '*' } = req.query;

    logger.info('Clearing cache', {
      correlationId: req.correlationId,
      userId: req.user.id || req.user.userId,
      pattern: pattern
    });

    // Send Kafka event for cache clear request
    await sendKafkaEvent('CACHE_CLEAR_REQUEST', {
      pattern,
      action: 'clear_cache'
    }, req.correlationId, req.user.id || req.user.userId);

    await deleteCachedData(pattern);

    logger.info('Cache cleared successfully', {
      correlationId: req.correlationId,
      userId: req.user.id || req.user.userId,
      pattern: pattern
    });

    // Send Kafka event for successful cache clear
    await sendKafkaEvent('CACHE_CLEAR_SUCCESS', {
      pattern,
      action: 'clear_cache_success'
    }, req.correlationId, req.user.id || req.user.userId);

    res.status(200).json({
      success: true,
      message: 'Cache cleared successfully',
      data: null
    });

  } catch (error) {
    logger.error('Error clearing cache', {
      error: error.message,
      stack: error.stack,
      correlationId: req.correlationId,
      userId: req.user?.id || req.user?.userId,
      query: req.query
    });

    // Send Kafka event for cache clear error
    await sendKafkaEvent('CACHE_CLEAR_ERROR', {
      pattern: req.query.pattern,
      error: error.message,
      action: 'clear_cache_error'
    }, req.correlationId, req.user?.id || req.user?.userId);

    res.status(500).json({
      success: false,
      message: 'Failed to clear cache',
      data: null
    });
  }
}]
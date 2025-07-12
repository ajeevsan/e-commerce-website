const axios = require('axios')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')


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

    if(!authHeader || !authHeader.startsWith('Bearer ')){
      return res.status(401).json({
        success: false,
        message: 'Access denied. Invalid token provided or no token provided',
        data: null
      })
    }

    const token = authHeader.substring(7)

    if(!token){
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
        data: null
      })
    }

    //! verify token 
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded;
    next()
  } catch (error) {
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

    const apiCategoryData = categoryMapping[category.toLowerCase()] || category;
    const allMongoCategoryData = await Product.find({ category : apiCategoryData})

    if (!allMongoCategoryData) {
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
    console.error('Error fetching category data: ', error.message)

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
    let allProducts = await Product.find({})
    
    const products = allProducts || []

    //! Implement Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit)
    const paginatedProducts = products.slice(startIndex, endIndex)

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
    console.error('Error fetching all Products: ', error.message)
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

    const response = await axios.get('https://dummyjson.com/products', {
      timeout: 10000,
    });

    const products = response.data.products || [];

    // Filter featured products (high rating or specific criteria)
    const featuredProducts = products
      .filter(product => product.rating >= 4.5)
      .slice(0, parseInt(limit));

    res.status(200).json({
      success: true,
      message: 'Featured products fetched successfully',
      data: {
        products: featuredProducts,
        count: featuredProducts.length
      }
    });

  } catch (error) {
    console.error('Error fetching featured products:', error.message);
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
    const response = await axios.get('https://dummyjson.com/products/categories', {
      timeout: 10000,
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
    console.error('Error fetching categories:', error.message);
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

    const response = await axios.get('https://dummyjson.com/products', {
      timeout: 10000,
    });

    const products = response.data.products || [];

    // Filter products with discounts
    const discountedProducts = products
      .filter(product => product.discountPercentage > 0)
      .sort((a, b) => b.discountPercentage - a.discountPercentage)
      .slice(0, parseInt(limit));

    res.status(200).json({
      success: true,
      message: 'Offers fetched successfully',
      data: {
        products: discountedProducts,
        count: discountedProducts.length
      }
    });

  } catch (error) {
    console.error('Error fetching offers:', error.message);
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

    const response = await axios.get(`https://dummyjson.com/products/${id}`, {
      timeout: 10000,
    });

    res.status(200).json({
      success: true,
      message: 'Product fetched successfully',
      data: response.data
    });

  } catch (error) {
    console.error('Error fetching product:', error.message);

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
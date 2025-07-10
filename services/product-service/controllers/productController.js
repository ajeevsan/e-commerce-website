const axios = require('axios')

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

//! API to get all the products data based on their categories.
exports.getCategoryData = async ( req, res) => {
    try {
        const { category } = req.params

        const { page=1, limit = 20, search = ''} = req.query
        
        const apiCategoryData = categoryMapping[category.toLowerCase()] || category;
        let apiUrl = `https://dummyjson.com/products/category/${apiCategoryData}`

        if(search){
            apiUrl = `https://dummyjson.com/products/search?q=${encodeURIComponent(search)}`;
        }

        const response = await axios.get(apiUrl, {
            timeout: 10000
        })


        if (!response.data || !response.data.products) {
      return res.status(404).json({
        success: false,
        message: 'No products found for this category',
        data: null
      });
    }

    const products = response.data.products

    // Filter by search if provided and not using search endpoint
    let filteredProducts = products;
    if (search && !apiUrl.includes('search')) {
      filteredProducts = products.filter(product =>
        product.title.toLowerCase().includes(search.toLowerCase()) ||
        product.description.toLowerCase().includes(search.toLowerCase()) ||
        product.category.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Implement Pagination
    const startIndex = (page -1) * limit
    const endIndex = startIndex + limit
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex)

    //! Calculate Paginate info
    const totalProducts =  filteredProducts.length;
    const totalPages = Math.ceil(totalProducts/limit);

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

        if(error.response?.status===404){
          return res.status(404).json({
            success: false,
            message: 'Category is not found or no products available',
            data: null
          })
        }

        if(error.code ==='ECONNABORTED'){
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
          error: process.env.NODE_ENV==='development'? error.message : undefined
        })
    }
}


//! APi to get all products 
exports.getAllProducts = async (req, res) => {
  try {
    const {page=1, limit= 20, search=''} = req.query;

    let apiUrl = 'https://dummyjson.com/products';

    if(search){
      apiUrl = `https://dummyjson.com/products/search?q=${encodeURIComponent(search)}`;
    }

    const response = await axios(apiUrl, {
      timeout: 10000
    })

    const products = response.data.products || []

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
          totalPages: Math.ceil(products.length/limit),
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
}


//! API to get featured products
exports.getFeaturedProducts = async (req, res) => {
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
};

//! API to get all categories
exports.getCategories = async (req, res) => {
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
};

//! API to get offers/discounted products
exports.getOffers = async (req, res) => {
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
};

//! API to get single product by ID
exports.getProductById = async (req, res) => {
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
};
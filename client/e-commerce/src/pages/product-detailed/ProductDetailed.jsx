import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { FaStar, FaShoppingCart, FaSearch } from 'react-icons/fa';
import { BiArrowBack } from 'react-icons/bi';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useCartAPI } from '../../hooks/useCartAPI'; 
import ApiService from '../../api/getProduct';
import './style.css';

export const ProductDetailed = () => {
  const { category } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { getCartItem } = useCart();
  
  // Use the cart API hook
  const {
    addToCartAPI,
    error: cartError,
    isOnline,
    clearError
  } = useCartAPI();
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({});
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page')) || 1);
  const [imageLoaded, setImagesLoaded] = useState(false)
  const [loadedImages, setLoadedImages] = useState(new Set())
  const [addingToCart, setAddingToCart] = useState(new Set()); // Track which products are being added

  // //! preloading images function 
  const preloadedImages = useCallback((imageUrls) => {
    return Promise.all(
      imageUrls.map(url => {
        return new Promise((resolve, reject) => {
          const img = new Image()
          img.onload = () => resolve(url)
          img.onerror = () => reject(url)
          img.src = url
        })
      })
    )
  }, [])

  const handleImageLoad = useCallback((productId) => {
    setLoadedImages(prev => {
      const newSet = new Set(prev)
      newSet.add(productId)
      return newSet;
    })
  }, [])

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setImagesLoaded(false)
      setLoadedImages(new Set())
      
      const response = await ApiService.getProductsByCategory(category, {
        page: currentPage,
        limit: 12,
        search: searchTerm
      });
      
      if (response.success) {
        setProducts(response.data.products);
        setPagination(response.data.pagination);

        //! preload images
        const imageUrls = response.data.products.map(product => product.thumbnail)

        try {
          await preloadedImages(imageUrls)
          setImagesLoaded(true)
        } catch (error) {
          console.error('error while preloading images', error)
          setImagesLoaded(true) 
        }
      } else {
        setError('Failed to fetch products');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  }, [category, currentPage, searchTerm, preloadedImages]); 

  useEffect(() => {
    if (isAuthenticated) {
      fetchProducts();
    }
  }, [isAuthenticated, fetchProducts]);

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  // Clear cart errors when component unmounts or when user navigates away
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    setSearchParams({ search: searchTerm, page: '1' });
    // Scroll to top after search
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    setSearchParams({ 
      ...(searchTerm && { search: searchTerm }), 
      page: newPage.toString() 
    });
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleProductClick = (productId) => {
    navigate(`/product/${productId}`);
  };

  const handleAddToCart = async (e, product) => {
    e.stopPropagation(); //! Prevent navigation when clicking add to cart
    
    if (product.stock <= 0) {
      alert('This product is out of stock');
      return;
    }

    const productId = product._id || product.id;
    
    // Check if already adding this product to cart
    if (addingToCart.has(productId)) {
      return;
    }

    try {
      // Mark product as being added to cart
      setAddingToCart(prev => new Set([...prev, productId]));
      
      // Clear any previous cart errors
      clearError();

      // Use the API hook to add to cart
      await addToCartAPI(product, 1);
      
      // Show success message
      alert(`${product.title} added to cart!`);
      
    } catch (error) {
      console.error('Error adding to cart:', error);
      
      // Handle different error scenarios
      if (error.status === 401) {
        alert('Please log in to add items to cart');
        navigate('/login');
      } else if (error.status === 0) {
        // Network error - item might still be added to local cart
        alert('Network error. Item added to local cart and will sync when connection is restored.');
      } else {
        alert(`Failed to add ${product.title} to cart. Please try again.`);
      }
    } finally {
      // Remove product from adding state
      setAddingToCart(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  const goBack = () => {
    window.history.back();
  };

  if (!isAuthenticated) {
    return (
      <div className="product-view-container">
        <div className="error">Please log in to view products</div>
      </div>
    );
  }

  if (loading || !imageLoaded) {
    return (
      <div className="product-view-container">
        <div className="loading">Loading products...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="product-view-container">
        <div className="error">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="product-view-container">
      <div className="product-header">
        <h1 className="category-title">
          {category.charAt(0).toUpperCase() + category.slice(1)} Products
        </h1>
        <button onClick={goBack} className="back-button">
          <BiArrowBack /> Back
        </button>
      </div>

      {/* Connection Status Indicator */}
      {!isOnline && (
        <div className="offline-indicator" style={{
          backgroundColor: '#ff6b6b',
          color: 'white',
          padding: '8px 16px',
          textAlign: 'center',
          marginBottom: '16px',
          borderRadius: '4px'
        }}>
          You're offline. Cart changes will sync when connection is restored.
        </div>
      )}

      {/* Cart Error Display */}
      {cartError && (
        <div className="cart-error" style={{
          backgroundColor: '#ffe6e6',
          color: '#d63031',
          padding: '8px 16px',
          textAlign: 'center',
          marginBottom: '16px',
          borderRadius: '4px',
          border: '1px solid #ff7675'
        }}>
          Cart Error: {cartError.message}
          <button 
            onClick={clearError}
            style={{
              marginLeft: '8px',
              background: 'none',
              border: 'none',
              color: '#d63031',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="search-form">
        <div className="search-input-container">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="search-button">
            Search
          </button>
        </div>
      </form>

      {/* Products Grid */}
      <div className="products-grid">
        {products.map((product, index) => {
          const productId = product._id || product.id;
          const cartItem = getCartItem(productId);
          const isAddingToCart = addingToCart.has(productId);
          
          return (
            <div 
              key={index} 
              className="product-card"
              onClick={() => handleProductClick(product.id)}
            >
              <div className="product-image">
                <img 
                  src={product.thumbnail} 
                  alt={product.title}
                  onLoad={() => handleImageLoad(product.id)}
                  className={`product-image ${loadedImages.has(product.id) ? 'loaded' : 'loading'}`}
                />
              </div>
              
              <div className="product-info">
                <h3 className="product-title">{product.title}</h3>
                <p className="product-description">
                  {product.description.length >= 100 
                    ? product.description.slice(0, 100) + '...' 
                    : product.description}
                </p>
                
                <div className="product-rating">
                  <FaStar className="star-icon" />
                  <span>{product.rating}</span>
                  <span className="review-count">({product.reviews?.length || 0} reviews)</span>
                </div>
                
                <div className="product-price">
                  <span className="current-price">${product.price}</span>
                  {product.discountPercentage > 0 && (
                    <span className="discount">-{product.discountPercentage}%</span>
                  )}
                </div>
                
                <div className="product-stock">
                  <span className={`stock-status ${product.stock > 0 ? 'in-stock' : 'out-of-stock'}`}>
                    {product.stock > 0 ? `In Stock (${product.stock})` : 'Out of Stock'}
                  </span>
                </div>
                
                <button 
                  className="add-to-cart-btn" 
                  disabled={product.stock === 0 || isAddingToCart}
                  onClick={(e) => handleAddToCart(e, product)}
                  style={{
                    opacity: (product.stock === 0 || isAddingToCart) ? 0.6 : 1,
                    cursor: (product.stock === 0 || isAddingToCart) ? 'not-allowed' : 'pointer'
                  }}
                >
                  <FaShoppingCart />
                  {isAddingToCart 
                    ? 'Adding...' 
                    : cartItem 
                      ? `In Cart (${cartItem.quantity})` 
                      : 'Add to Cart'
                  }
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="pagination">
          <button 
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={!pagination.hasPreviousPage}
            className="pagination-btn"
          >
            Previous
          </button>
          
          <span className="pagination-info">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          
          <button 
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={!pagination.hasNextPage}
            className="pagination-btn"
          >
            Next
          </button>
        </div>
      )}
      
      {products.length === 0 && (
        <div className="no-products">
          <p>No products found in this category.</p>
        </div>
      )}
    </div>
  );
};
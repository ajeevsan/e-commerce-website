import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { FaStar, FaShoppingCart, FaSearch } from 'react-icons/fa';
import { BiArrowBack } from 'react-icons/bi';
import { useAuth } from '../../context/AuthContext';
import ApiService from '../../api/getProduct';
import './style.css';

export const ProductDetailed = () => {
  const { category } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({});
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page')) || 1);
  const [imageLoaded, setImagesLoaded] = useState(false)
  const [loadedImages, setLoadedImages] = useState(new Set())

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
        <button onClick={goBack} className="back-button">
          <BiArrowBack /> Back
        </button>
        <h1 className="category-title">
          {category.charAt(0).toUpperCase() + category.slice(1)} Products
        </h1>
      </div>

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
        {products.map((product) => (
          <div key={product.id} className="product-card">
            <div className="product-image">
              <img src={product.thumbnail} 
                alt={product.title}
                onLoad={() => handleImageLoad(product.id)}
                className={`product-img ${loadedImages.has(product.id) ? 'loaded' : 'loading'}`}/>
            </div>
            
            <div className="product-info">
              <h3 className="product-title">{product.title}</h3>
              <p className="product-description">{product.description.length>=100?product.description.slice(1,100)+'...':product.description}</p>
              
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
              
              <button className="add-to-cart-btn" disabled={product.stock === 0}>
                <FaShoppingCart /> Add to Cart
              </button>
            </div>
          </div>
        ))}
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
import React, { useState, useEffect } from 'react';
import { FaStar, FaShoppingCart, FaHeart, FaEye } from 'react-icons/fa';
import { MdCategory } from 'react-icons/md';
import { BiDollar } from 'react-icons/bi';
import './style.css';

export const ProductDetailed = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://dummyjson.com/products');
      
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      
      const data = await response.json();
      setProducts(data.products);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={i} className="star filled" />);
    }

    if (hasHalfStar) {
      stars.push(<FaStar key="half" className="star half-filled" />);
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<FaStar key={`empty-${i}`} className="star empty" />);
    }

    return stars;
  };

  if (loading) {
    return (
      <div className="product-view-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="product-view-container">
        <div className="error-message">
          <p>Error: {error}</p>
          <button onClick={fetchProducts} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="product-view-container">
      <div className="product-header">
        <h1>Our Products</h1>
        <p>Discover amazing products from our collection</p>
      </div>

      <div className="products-grid">
        {products.map((product) => (
          <div key={product.id} className="product-card">
            <div className="product-image-container">
              <img 
                src={product.thumbnail} 
                alt={product.title}
                className="product-image"
              />
              <div className="product-overlay">
                <button className="overlay-button">
                  <FaEye />
                </button>
                <button className="overlay-button">
                  <FaHeart />
                </button>
              </div>
              {product.discountPercentage > 0 && (
                <div className="discount-badge">
                  -{Math.round(product.discountPercentage)}%
                </div>
              )}
            </div>

            <div className="product-info">
              <div className="product-category">
                <MdCategory />
                <span>{product.category}</span>
              </div>

              <h3 className="product-title">{product.title}</h3>
              <p className="product-description">{product.description}</p>

              <div className="product-rating">
                <div className="stars">
                  {renderStars(product.rating)}
                </div>
                <span className="rating-text">({product.rating})</span>
              </div>

              <div className="product-price">
                <span className="current-price">
                  <BiDollar />${product.price}
                </span>
                {product.discountPercentage > 0 && (
                  <span className="original-price">
                    ${(product.price / (1 - product.discountPercentage / 100)).toFixed(2)}
                  </span>
                )}
              </div>

              <div className="product-stock">
                <span className={`stock-status ${product.stock > 0 ? 'in-stock' : 'out-of-stock'}`}>
                  {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                </span>
              </div>

              <button className="add-to-cart-button" disabled={product.stock === 0}>
                <FaShoppingCart />
                Add to Cart
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};


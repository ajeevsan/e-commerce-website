import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaStar, FaShoppingCart, FaHeart, FaShare, FaMinus, FaPlus } from 'react-icons/fa';
import { BiArrowBack } from 'react-icons/bi';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import ApiService from '../../api/getProduct';
import './style.css';

export const ProductDetail = () => {
  const { id } = useParams();
  console.log('pramas_id___', id)
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addToCart, getCartItem, updateQuantity } = useCart();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isInWishlist, setIsInWishlist] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // You'll need to implement this API call
        const response = await ApiService.getProductById(id);
        
        if (response.success) {
          setProduct(response.data);
          setSelectedImage(0);
        } else {
          setError('Product not found');
        }
      } catch (err) {
        setError(err.message);
        console.error('Error fetching product:', err);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated && id) {
      fetchProduct();
    }
  }, [id, isAuthenticated]);

  const handleAddToCart = () => {
    if (product && product.stock > 0) {
      const cartItem = getCartItem(product.id);
      
      if (cartItem) {
        // If item already in cart, update quantity
        updateQuantity(product.id, cartItem.quantity + quantity);
      } else {
        // Add new item to cart
        addToCart({
          id: product.id,
          title: product.title,
          price: product.price,
          thumbnail: product.thumbnail,
          stock: product.stock
        });
      }
      
      // Show success message or redirect
      alert('Product added to cart!');
    }
  };

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity >= 1 && newQuantity <= product.stock) {
      setQuantity(newQuantity);
    }
  };

  const handleWishlist = () => {
    setIsInWishlist(!isInWishlist);
    // Implement wishlist logic here
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.title,
        text: product.description,
        url: window.location.href,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Product link copied to clipboard!');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="product-detail-container">
        <div className="error">Please log in to view product details</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="product-detail-container">
        <div className="loading">Loading product details...</div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="product-detail-container">
        <div className="error">Error: {error || 'Product not found'}</div>
      </div>
    );
  }

  const discountedPrice = product.price * (1 - product.discountPercentage / 100);
  const cartItem = getCartItem(product.id);

  return (
    <div className="product-detail-container">
      <div className="product-detail-header">
        <button onClick={() => navigate(-1)} className="back-button">
          <BiArrowBack /> Back
        </button>
        <div className="product-actions">
          <button 
            onClick={handleWishlist}
            className={`action-btn ${isInWishlist ? 'active' : ''}`}
          >
            <FaHeart />
          </button>
          <button onClick={handleShare} className="action-btn">
            <FaShare />
          </button>
        </div>
      </div>

      <div className="product-detail-content">
        {/* Product Images */}
        <div className="product-images">
          <div className="main-image">
            <img 
              src={product.images?.[selectedImage] || product.thumbnail} 
              alt={product.title}
            />
          </div>
          {product.images && product.images.length > 1 && (
            <div className="thumbnail-images">
              {product.images.map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`${product.title} ${index + 1}`}
                  className={selectedImage === index ? 'active' : ''}
                  onClick={() => setSelectedImage(index)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="product-info">
          <div className="product-brand">{product.brand}</div>
          <h1 className="product-title">{product.title}</h1>
          
          <div className="product-rating">
            <div className="stars">
              {[...Array(5)].map((_, index) => (
                <FaStar 
                  key={index}
                  className={index < Math.floor(product.rating) ? 'filled' : 'empty'}
                />
              ))}
            </div>
            <span className="rating-number">{product.rating}</span>
            <span className="review-count">({product.reviews?.length || 0} reviews)</span>
          </div>

          <div className="product-price">
            <span className="current-price">${discountedPrice.toFixed(2)}</span>
            {product.discountPercentage > 0 && (
              <>
                <span className="original-price">${product.price}</span>
                <span className="discount-badge">{product.discountPercentage}% OFF</span>
              </>
            )}
          </div>

          <div className="product-description">
            <h3>Description</h3>
            <p>{product.description}</p>
          </div>

          <div className="product-details">
            <div className="detail-item">
              <span className="label">Category:</span>
              <span className="value">{product.category}</span>
            </div>
            <div className="detail-item">
              <span className="label">Stock:</span>
              <span className={`value ${product.stock > 0 ? 'in-stock' : 'out-of-stock'}`}>
                {product.stock > 0 ? `${product.stock} available` : 'Out of Stock'}
              </span>
            </div>
          </div>

          {/* Quantity Selector */}
          <div className="quantity-selector">
            <label>Quantity:</label>
            <div className="quantity-controls">
              <button 
                onClick={() => handleQuantityChange(quantity - 1)}
                disabled={quantity <= 1}
              >
                <FaMinus />
              </button>
              <span className="quantity-display">{quantity}</span>
              <button 
                onClick={() => handleQuantityChange(quantity + 1)}
                disabled={quantity >= product.stock}
              >
                <FaPlus />
              </button>
            </div>
          </div>

          {/* Add to Cart Button */}
          <div className="cart-actions">
            <button 
              className="add-to-cart-btn"
              onClick={handleAddToCart}
              disabled={product.stock === 0}
            >
              <FaShoppingCart />
              {cartItem ? 'Update Cart' : 'Add to Cart'}
            </button>
            {cartItem && (
              <div className="cart-info">
                Already in cart: {cartItem.quantity} items
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Product Reviews */}
      {product.reviews && product.reviews.length > 0 && (
        <div className="product-reviews">
          <h3>Customer Reviews</h3>
          {product.reviews.map((review, index) => (
            <div key={index} className="review-item">
              <div className="review-header">
                <div className="reviewer-name">{review.reviewerName}</div>
                <div className="review-rating">
                  {[...Array(5)].map((_, starIndex) => (
                    <FaStar 
                      key={starIndex}
                      className={starIndex < review.rating ? 'filled' : 'empty'}
                    />
                  ))}
                </div>
                <div className="review-date">{new Date(review.date).toLocaleDateString()}</div>
              </div>
              <div className="review-comment">{review.comment}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
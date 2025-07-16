import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaShoppingCart, FaMinus, FaPlus, FaTrash } from "react-icons/fa";
import { BiArrowBack } from "react-icons/bi";
import { useAuth } from "../../context/AuthContext";
import { useCart } from '../../context/CartContext';
import cartService from "../../api/cartApi";
import { Notification } from "../../components/Notification";
import "./style.css";

export const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth(); // Get user from auth context
  const { cart, getCartItem, updateQuantity, removeFromCart: removeFromCartContext, setCart } = useCart();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingItem, setUpdatingItem] = useState(null);
  const [notifications, setNotifications] = useState([]);

  // Use cart data from context instead of local state
  const product = cart;

  useEffect(() => {
    const fetchAndSetCart = async () => {
      try {
        setLoading(true);
        setError(null);

        // Use user ID from auth context if available, otherwise use the id from params
        const userId = user?.id || id;
        const response = await cartService.getCart(userId);

        if (response.success) {
          // Set the cart data in context instead of local state
          setCart(response.data);
        } else {
          setError("Cart not found");
        }
      } catch (err) {
        setError(err.message);
        console.error("Error fetching cart:", err);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchAndSetCart();
    }
  }, [id, isAuthenticated, setCart, user]);

  const handleQuantityChange = async (productId, newQuantity) => {
    if (newQuantity < 1) return;

    // Get the specific cart item using getCartItem
    const cartItem = getCartItem(productId);
    if (!cartItem) return;

    // Find the item in the cart to check stock
    const item = product.items?.find((item) => item.productId === productId);
    if (!item) return;

    if (newQuantity > item.stock) {
      addNotification(
        "error",
        "Stock Limit",
        `Only ${item.stock} items available in stock`
      );
      return;
    }

    try {
      setUpdatingItem(productId);

      // Update context first for immediate UI response
      updateQuantity(productId, newQuantity);

      // Make API call to update quantity
      const userId = user?.id || product.userId;
      await cartService.updateItemQuantity(userId, productId, newQuantity);
      
      addNotification(
        "success",
        "Updated",
        "Quantity updated successfully"
      );
      
    } catch (err) {
      console.error("Error updating quantity:", err);
      
      addNotification(
        "error",
        "Update Failed",
        "Failed to update quantity. Please try again."
      );
      
      // Revert changes if API call fails
      try {
        const userId = user?.id || id;
        const response = await cartService.getCart(userId);
        if (response.success) {
          setCart(response.data);
        }
      } catch (revertErr) {
        console.error("Error reverting cart state:", revertErr);
      }
    } finally {
      setUpdatingItem(null);
    }
  };

  //! Notification methods
  const addNotification = (type, title, message) => {
    const notificationId = Date.now();

    const newNotification = {
      id: notificationId,
      type,
      title,
      message,
      onClose: () => removeNotification(notificationId),
    };
    setNotifications((prev) => [...prev, newNotification]);
  };

  const removeNotification = (notificationId) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== notificationId));
  };

  const handleRemoveItem = async (productId) => {
    try {
      console.log("productId___", productId);
      setUpdatingItem(productId);

      // Remove from context first for immediate UI response
      removeFromCartContext(productId);

      // Make API call to remove item
      const userId = user?.id || product.userId;
      await cartService.removeFromCart(userId, productId);

      addNotification(
        "success",
        "Success",
        "The Product has been successfully removed."
      );
    } catch (err) {
      console.error("Error removing item:", err);
      
      addNotification(
        "error",
        "Remove Failed",
        "Failed to remove item. Please try again."
      );
      
      // Revert changes if API call fails
      try {
        const userId = user?.id || id;
        const response = await cartService.getCart(userId);
        if (response.success) {
          setCart(response.data);
        }
      } catch (revertErr) {
        console.error("Error reverting cart state:", revertErr);
      }
    } finally {
      setUpdatingItem(null);
    }
  };

  const calculateItemTotal = (price, quantity) => {
    return (price * quantity).toFixed(2);
  };

  if (!isAuthenticated) {
    return (
      <div className="product-detail-container">
        <div className="error">Please log in to view your cart</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="product-detail-container">
        <div className="loading">Loading cart details...</div>
      </div>
    );
  }

  if (error || !product || !product.items) {
    return (
      <div className="product-detail-container">
        <div className="error">Error: {error || "Cart not found"}</div>
      </div>
    );
  }

  return (
    <div className="product-detail-container">
      <div className="product-detail-header">
        <button onClick={() => navigate(-1)} className="back-button">
          <BiArrowBack /> Back
        </button>
        <div className="cart-title">
          <h2>My Cart ({product.totalItems || 0} items)</h2>
        </div>
      </div>

      {notifications.map((notification, index) => (
        <Notification
          key={notification.id}
          type={notification.type}
          title={notification.title}
          message={notification.message}
          onClose={notification.onClose}
          duration={4000}
          position="top-right"
          index={index}
        />
      ))}

      {product.items.length === 0 ? (
        <div className="empty-cart">
          <FaShoppingCart size={50} />
          <h3>Your cart is empty</h3>
          <p>Add some items to get started</p>
        </div>
      ) : (
        <div className="cart-section">
          <div className="left-section">
            {product.items.map((item) => {
              // Use getCartItem to get additional context data if needed
              // const cartItem = getCartItem(item.productId);
              
              return (
                <div className="cart-card" key={item._id || item.productId}>
                  <div className="cart-image">
                    <img
                      src={item.productImage}
                      alt={item.productTitle}
                      className="cart-img"
                    />
                  </div>
                  <div className="cart-info">
                    <h5 className="cart-title">{item.productTitle}</h5>
                    <div className="cart-price">
                      <span className="price">${item.price}</span>
                      <span className="stock-info">In Stock: {item.stock}</span>
                    </div>
                    <div className="cart-controls">
                      <div className="quantity-controls">
                        <button
                          className="quantity-btn"
                          onClick={() =>
                            handleQuantityChange(
                              item.productId,
                              item.quantity - 1
                            )
                          }
                          disabled={
                            item.quantity <= 1 || updatingItem === item.productId
                          }
                        >
                          <FaMinus />
                        </button>
                        <span className="quantity-display">{item.quantity}</span>
                        <button
                          className="quantity-btn"
                          onClick={() =>
                            handleQuantityChange(
                              item.productId,
                              item.quantity + 1
                            )
                          }
                          disabled={
                            item.quantity >= item.stock ||
                            updatingItem === item.productId
                          }
                        >
                          <FaPlus />
                        </button>
                      </div>
                      <div className="item-total">
                        <span>
                          Total: ${calculateItemTotal(item.price, item.quantity)}
                        </span>
                      </div>
                      <button
                        className="remove-btn"
                        onClick={() => handleRemoveItem(item.productId)}
                        disabled={updatingItem === item.productId}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="right-section">
            <div className="cart-header">
              <h3>PRICE DETAILS</h3>
              <div className="cart-calculation">
                <div className="calculation-row">
                  <span>Price ({product.totalItems || 0} items)</span>
                  <span>${(product.totalPrice || 0).toFixed(2)}</span>
                </div>
                <div className="calculation-row">
                  <span>Delivery Charges</span>
                  <span className="free">FREE</span>
                </div>
                <div className="calculation-row">
                  <span>Coupons</span>
                  <span>
                    {product.coupon && Object.keys(product.coupon).length > 0
                      ? "Applied"
                      : "No coupons"}
                  </span>
                </div>
              </div>
              <div className="show-total-amount">
                <h3>Total Amount</h3>
                <h3>${(product.totalPrice || 0).toFixed(2)}</h3>
              </div>
              <button className="checkout-btn" onClick={() => navigate('/payment')}>
                <FaShoppingCart /> Proceed to Checkout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
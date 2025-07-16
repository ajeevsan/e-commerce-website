import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaCreditCard, 
  FaPaypal, 
  FaGooglePay, 
  FaUniversity, 
  FaLock, 
  FaCheckCircle,
  FaShieldAlt,
  FaWallet
} from 'react-icons/fa';
import { BiArrowBack } from 'react-icons/bi';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
// import cartService from '../../api/cartApi';
import { Notification } from '../../components/Notification';
import './style.css';

export const Payment = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { cart, clearCart } = useCart();
  
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('card');
  const [formData, setFormData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardHolderName: '',
    upiId: '',
    netBankingBank: '',
    walletType: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState([]);

  // Calculate order totals
  const calculateTotals = (cartData) => {
    const subtotal = cartData.totalPrice || 0;
    const delivery = subtotal > 500 ? 0 : 50; // Free delivery over $500
    const tax = subtotal * 0.18; // 18% GST
    const total = subtotal + delivery + tax;
    
    return {
      subtotal: subtotal,
      delivery: delivery,
      tax: tax,
      total: total
    };
  };

  useEffect(() => {
    const loadOrderData = async () => {
      try {
        if (!isAuthenticated) {
          navigate('/login');
          return;
        }

        if (!cart || !cart.items || cart.items.length === 0) {
          setError('Your cart is empty');
          setLoading(false);
          return;
        }

        // Calculate totals based on cart data
        const totals = calculateTotals(cart);
        
        setOrderData({
          items: cart.items.map(item => ({
            id: item.productId,
            name: item.productTitle,
            quantity: item.quantity,
            price: item.price,
            image: item.productImage
          })),
          ...totals
        });

        setLoading(false);
      } catch (err) {
        setError('Failed to load order data', err);
        setLoading(false);
      }
    };

    loadOrderData();
  }, [cart, isAuthenticated, navigate]);

  const addNotification = (type, title, message) => {
    const id = Date.now();
    const newNotification = {
      id,
      type,
      title,
      message,
      onClose: () => removeNotification(id),
    };
    setNotifications((prev) => [...prev, newNotification]);
  };

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePaymentMethodChange = (method) => {
    setSelectedPaymentMethod(method);
  };

  const validateForm = () => {
    switch (selectedPaymentMethod) {
      case 'card':
        return formData.cardNumber.length >= 16 && 
               formData.expiryDate.length >= 5 && 
               formData.cvv.length >= 3 && 
               formData.cardHolderName.trim().length > 0;
      case 'upi':
        return formData.upiId.includes('@') && formData.upiId.length > 5;
      case 'netbanking':
        return formData.netBankingBank.length > 0;
      case 'wallet':
        return formData.walletType.length > 0;
      default:
        return false;
    }
  };

  const processPayment = async () => {
    try {
      // This would be your actual payment API call
      // For now, we'll simulate the API call
      const response = await new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            orderId: `ORD-${Date.now()}`,
            transactionId: `TXN-${Date.now()}`,
            amount: orderData.total
          });
        }, 2000);
      });

      if (response.success) {
        // Clear the cart after successful payment
        clearCart();
        
        // You might want to save order details to your backend here
        // await orderService.createOrder(response);
        
        return response;
      } else {
        throw new Error(response.message || 'Payment failed');
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      addNotification('error', 'Error', 'Please fill in all required fields');
      return;
    }

    setIsProcessing(true);
    
    try {
      const paymentData = {
        userId: user?.id,
        cartId: cart.id,
        paymentMethod: selectedPaymentMethod,
        amount: orderData.total,
        currency: 'INR',
        items: orderData.items,
        paymentDetails: {
          [selectedPaymentMethod]: formData
        }
      };

      const paymentResponse = await processPayment(paymentData);
      
      if (paymentResponse.success) {
        setShowSuccessModal(true);
        addNotification('success', 'Success', 'Payment processed successfully');
        
        // Auto close modal and redirect after 3 seconds
        setTimeout(() => {
          setShowSuccessModal(false);
          navigate('/orders');
        }, 3000);
      }
    } catch (error) {
      addNotification('error', 'Payment Failed', error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCardNumber = (value) => {
    return value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiryDate = (value) => {
    return value.replace(/\D/g, '').replace(/(\d{2})(\d{2})/, '$1/$2');
  };

  const paymentMethods = [
    {
      id: 'card',
      label: 'Credit/Debit Card',
      icon: <FaCreditCard />,
      popular: true
    },
    {
      id: 'upi',
      label: 'UPI',
      icon: <FaGooglePay />,
      popular: true
    },
    {
      id: 'netbanking',
      label: 'Net Banking',
      icon: <FaUniversity />,
      popular: false
    },
    {
      id: 'wallet',
      label: 'Digital Wallet',
      icon: <FaWallet />,
      popular: false
    }
  ];

  const banks = [
    'State Bank of India',
    'HDFC Bank',
    'ICICI Bank',
    'Axis Bank',
    'Punjab National Bank',
    'Bank of Baroda',
    'Canara Bank',
    'Union Bank of India'
  ];

  const walletOptions = [
    'Paytm',
    'PhonePe',
    'Google Pay',
    'Amazon Pay',
    'Mobikwik',
    'Freecharge'
  ];

  if (!isAuthenticated) {
    return (
      <div className="payment-container">
        <div className="error">Please log in to proceed with payment</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="payment-container">
        <div className="loading">Loading payment details...</div>
      </div>
    );
  }

  if (error || !orderData) {
    return (
      <div className="payment-container">
        <div className="error">
          {error || 'Unable to load order data'}
          <button onClick={() => navigate('/cart')} className="back-to-cart-btn">
            Go to Cart
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-container">
      <div className="payment-header">
        <button onClick={() => navigate(-1)} className="back-button">
          <BiArrowBack /> Back
        </button>
        <h2>Payment</h2>
        <div className="security-badge">
          <FaShieldAlt /> Secure Payment
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

      <div className="payment-content">
        <div className="payment-left">
          <div className="payment-methods">
            <h3>Select Payment Method</h3>
            <div className="payment-options">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className={`payment-option ${selectedPaymentMethod === method.id ? 'selected' : ''}`}
                  onClick={() => handlePaymentMethodChange(method.id)}
                >
                  <div className="payment-option-header">
                    <div className="payment-option-icon">{method.icon}</div>
                    <span className="payment-option-label">{method.label}</span>
                    {method.popular && <span className="popular-badge">Popular</span>}
                  </div>
                  <div className="payment-option-radio">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method.id}
                      checked={selectedPaymentMethod === method.id}
                      onChange={() => handlePaymentMethodChange(method.id)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="payment-form">
            <form onSubmit={handleSubmit}>
              {selectedPaymentMethod === 'card' && (
                <div className="card-form">
                  <h4>Card Details</h4>
                  <div className="form-group">
                    <label>Card Number</label>
                    <input
                      type="text"
                      name="cardNumber"
                      value={formatCardNumber(formData.cardNumber)}
                      onChange={(e) => handleInputChange({
                        target: {
                          name: 'cardNumber',
                          value: e.target.value.replace(/\s/g, '').slice(0, 16)
                        }
                      })}
                      placeholder="1234 5678 9012 3456"
                      maxLength="19"
                      required
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Expiry Date</label>
                      <input
                        type="text"
                        name="expiryDate"
                        value={formatExpiryDate(formData.expiryDate)}
                        onChange={(e) => handleInputChange({
                          target: {
                            name: 'expiryDate',
                            value: e.target.value.replace(/\D/g, '').slice(0, 4)
                          }
                        })}
                        placeholder="MM/YY"
                        maxLength="5"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>CVV</label>
                      <input
                        type="text"
                        name="cvv"
                        value={formData.cvv}
                        onChange={handleInputChange}
                        placeholder="123"
                        maxLength="3"
                        required
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Card Holder Name</label>
                    <input
                      type="text"
                      name="cardHolderName"
                      value={formData.cardHolderName}
                      onChange={handleInputChange}
                      placeholder="John Doe"
                      required
                    />
                  </div>
                </div>
              )}

              {selectedPaymentMethod === 'upi' && (
                <div className="upi-form">
                  <h4>UPI Details</h4>
                  <div className="form-group">
                    <label>UPI ID</label>
                    <input
                      type="text"
                      name="upiId"
                      value={formData.upiId}
                      onChange={handleInputChange}
                      placeholder="example@upi"
                      required
                    />
                  </div>
                  <div className="upi-options">
                    <div className="upi-option">
                      <FaGooglePay size={30} />
                      <span>Google Pay</span>
                    </div>
                    <div className="upi-option">
                      <FaPaypal size={30} />
                      <span>PhonePe</span>
                    </div>
                    <div className="upi-option">
                      <FaWallet size={30} />
                      <span>Paytm</span>
                    </div>
                  </div>
                </div>
              )}

              {selectedPaymentMethod === 'netbanking' && (
                <div className="netbanking-form">
                  <h4>Select Your Bank</h4>
                  <div className="form-group">
                    <select
                      name="netBankingBank"
                      value={formData.netBankingBank}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Bank</option>
                      {banks.map((bank) => (
                        <option key={bank} value={bank}>{bank}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {selectedPaymentMethod === 'wallet' && (
                <div className="wallet-form">
                  <h4>Select Wallet</h4>
                  <div className="wallet-options">
                    {walletOptions.map((wallet) => (
                      <div
                        key={wallet}
                        className={`wallet-option ${formData.walletType === wallet ? 'selected' : ''}`}
                        onClick={() => setFormData(prev => ({...prev, walletType: wallet}))}
                      >
                        <FaWallet />
                        <span>{wallet}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button 
                type="submit" 
                className="pay-button"
                disabled={isProcessing || !validateForm()}
              >
                {isProcessing ? (
                  <>
                    <div className="spinner"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <FaLock /> Pay ${orderData.total.toFixed(2)}
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        <div className="payment-right">
          <div className="order-summary">
            <h3>Order Summary</h3>
            <div className="order-items">
              {orderData.items.map((item) => (
                <div key={item.id} className="order-item">
                  <div className="item-info">
                    <span className="item-name">{item.name}</span>
                    <span className="item-quantity">Qty: {item.quantity}</span>
                  </div>
                  <span className="item-price">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="order-totals">
              <div className="total-row">
                <span>Subtotal</span>
                <span>${orderData.subtotal.toFixed(2)}</span>
              </div>
              <div className="total-row">
                <span>Delivery</span>
                <span className="free">{orderData.delivery === 0 ? 'FREE' : `$${orderData.delivery.toFixed(2)}`}</span>
              </div>
              <div className="total-row">
                <span>Tax (GST 18%)</span>
                <span>${orderData.tax.toFixed(2)}</span>
              </div>
              <div className="total-row final-total">
                <span>Total</span>
                <span>${orderData.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="security-info">
            <div className="security-item">
              <FaShieldAlt />
              <span>SSL Secured Payment</span>
            </div>
            <div className="security-item">
              <FaLock />
              <span>256-bit Encryption</span>
            </div>
            <div className="security-item">
              <FaCheckCircle />
              <span>PCI DSS Compliant</span>
            </div>
          </div>
        </div>
      </div>

      {showSuccessModal && (
        <div className="success-modal-overlay">
          <div className="success-modal">
            <div className="success-icon">
              <FaCheckCircle />
            </div>
            <h3>Payment Successful!</h3>
            <p>Your order has been placed successfully.</p>
            <p>Order ID: #ORD-{Date.now()}</p>
            <div className="success-amount">${orderData.total.toFixed(2)}</div>
            <p>Redirecting to orders...</p>
          </div>
        </div>
      )}
    </div>
  );
};
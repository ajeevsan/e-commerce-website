import { useCallback, useEffect, useState } from 'react';
import { useCart } from '../context/CartContext';
import cartService from '../api/cartApi';
import Cookies from 'js-cookie';

/**
 * Custom hook for managing cart API operations
 * Bridges the gap between CartContext and server API
 */
export const useCartAPI = () => {
  const { setCart, cart, clearCart } = useCart();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const userId = Cookies.get('userId');

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Error handler
  const handleError = useCallback((error, operation) => {
    console.error(`Cart API Error (${operation}):`, error);
    setError(error);
    
    // Don't clear cart on network errors - keep local data
    if (error.status !== 0) {
      // Server error, not network error
      return false;
    }
    return true; // Network error, continue with local operations
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Load cart from server
  const loadCart = useCallback(async () => {
    if (!userId) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const response = await cartService.getOrCreateCart(userId);
      if (response.success) {
        setCart(response.data);
      }
    } catch (error) {
      handleError(error, 'loadCart');
    } finally {
      setIsLoading(false);
    }
  }, [userId, setCart, handleError]);

  // Sync local cart with server
  const syncCart = useCallback(async () => {
    if (!userId || !isOnline) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const formattedCart = cartService.formatCartData(cart);
      const response = await cartService.syncCart(userId, formattedCart);
      if (response.success) {
        setCart(response.data);
      }
    } catch (error) {
      handleError(error, 'syncCart');
    } finally {
      setIsLoading(false);
    }
  }, [userId, cart, setCart, handleError, isOnline]);

  // Add item to cart (API + local)
  const addToCartAPI = useCallback(async (product, quantity = 1) => {
    if (!userId) return;

    const itemData = {
      productId: product._id || product.id,
      quantity,
      price: product.price,
      productTitle: product.title,
      productImage: product.thumbnail,
      stock: product.stock
    };

    // If offline, only update local cart
    if (!isOnline) {
      // Use local cart context method
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await cartService.addToCart(userId, itemData);
      if (response.success) {
        setCart(response.data);
        return response.data;
      }
    } catch (error) {
      const canContinue = handleError(error, 'addToCart');
      if (!canContinue) {
        throw error;
      }
    } finally {
      setIsLoading(false);
    }
  }, [userId, setCart, handleError, isOnline]);

  // Update item quantity (API + local)
  const updateQuantityAPI = useCallback(async (productId, quantity) => {
    if (!userId) return;

    // If offline, only update local cart
    if (!isOnline) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await cartService.updateItemQuantity(userId, productId, quantity);
      if (response.success) {
        setCart(response.data);
        return response.data;
      }
    } catch (error) {
      const canContinue = handleError(error, 'updateQuantity');
      if (!canContinue) {
        throw error;
      }
    } finally {
      setIsLoading(false);
    }
  }, [userId, setCart, handleError, isOnline]);

  // Remove item from cart (API + local)
  const removeFromCartAPI = useCallback(async (productId) => {
    if (!userId) return;

    // If offline, only update local cart
    if (!isOnline) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await cartService.removeFromCart(userId, productId);
      if (response.success) {
        setCart(response.data);
        return response.data;
      }
    } catch (error) {
      const canContinue = handleError(error, 'removeFromCart');
      if (!canContinue) {
        throw error;
      }
    } finally {
      setIsLoading(false);
    }
  }, [userId, setCart, handleError, isOnline]);

  // Clear cart (API + local)
  const clearCartAPI = useCallback(async () => {
    if (!userId) return;

    // If offline, only update local cart
    if (!isOnline) {
      clearCart();
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await cartService.clearCart(userId);
      if (response.success) {
        clearCart();
        return response.data;
      }
    } catch (error) {
      const canContinue = handleError(error, 'clearCart');
      if (canContinue) {
        clearCart(); // Clear local cart even if API fails
      }
    } finally {
      setIsLoading(false);
    }
  }, [userId, clearCart, handleError, isOnline]);

  // Validate cart with server
  const validateCart = useCallback(async () => {
    if (!userId || !isOnline) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await cartService.validateCart(userId);
      if (response.success) {
        return response.data;
      }
    } catch (error) {
      handleError(error, 'validateCart');
    } finally {
      setIsLoading(false);
    }
  }, [userId, handleError, isOnline]);

  // Apply coupon
  const applyCoupon = useCallback(async (couponCode) => {
    if (!userId || !isOnline) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await cartService.applyCoupon(userId, couponCode);
      if (response.success) {
        setCart(response.data);
        return response.data;
      }
    } catch (error) {
      handleError(error, 'applyCoupon');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [userId, setCart, handleError, isOnline]);

  // Remove coupon
  const removeCoupon = useCallback(async () => {
    if (!userId || !isOnline) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await cartService.removeCoupon(userId);
      if (response.success) {
        setCart(response.data);
        return response.data;
      }
    } catch (error) {
      handleError(error, 'removeCoupon');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [userId, setCart, handleError, isOnline]);

  // Auto-sync cart when coming back online
  useEffect(() => {
    if (isOnline && userId && cart.items.length > 0) {
      // Debounce sync to avoid too many calls
      const timeoutId = setTimeout(() => {
        syncCart();
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [isOnline, userId, cart.items.length, syncCart]);

  // Load cart on mount
  useEffect(() => {
    if (userId && isOnline) {
      loadCart();
    }
  }, [userId, isOnline, loadCart]);

  return {
    // State
    isLoading,
    error,
    isOnline,
    
    // Actions
    loadCart,
    syncCart,
    addToCartAPI,
    updateQuantityAPI,
    removeFromCartAPI,
    clearCartAPI,
    validateCart,
    applyCoupon,
    removeCoupon,
    clearError,
    
    // Utilities
    cartService // Direct access to service if needed
  };
};
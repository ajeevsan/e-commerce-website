import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';

const CartContext = createContext();

// Cart reducer
const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_TO_CART': {
      console.log('add to cart triggered');
      const { items } = action.payload;
      const productToAdd = items[0]; 
      
      const existingItemIndex = state.items.findIndex(
        item => item.productId === productToAdd.id
      );
      
      let updatedItems;
      if (existingItemIndex > -1) {
        // Item exists, update quantity
        updatedItems = state.items.map((item, index) => 
          index === existingItemIndex 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        // New item, add to cart
        const newItem = {
          productId: productToAdd.id,
          quantity: 1,
          price: productToAdd.price,
          productTitle: productToAdd.productTitle,
          productImage: productToAdd.productImage,
          addedAt: new Date().toISOString()
        };
        updatedItems = [...state.items, newItem];
      }
      
      // Calculate totals
      const totalItems = updatedItems.reduce((total, item) => total + item.quantity, 0);
      const totalPrice = updatedItems.reduce((total, item) => total + (item.price * item.quantity), 0);
      
      return {
        ...state,
        items: updatedItems,
        totalItems,
        totalPrice,
        lastModified: new Date().toISOString()
      };
    }
    
    case 'REMOVE_FROM_CART': {
      const updatedItems = state.items.filter(item => item.productId !== action.payload);
      const totalItems = updatedItems.reduce((total, item) => total + item.quantity, 0);
      const totalPrice = updatedItems.reduce((total, item) => total + (item.price * item.quantity), 0);
      
      return {
        ...state,
        items: updatedItems,
        totalItems,
        totalPrice,
        lastModified: new Date().toISOString()
      };
    }
    
    case 'UPDATE_QUANTITY': {
      const { productId, quantity } = action.payload;
      
      if (quantity <= 0) {
        // Remove item if quantity is 0 or less
        return cartReducer(state, { type: 'REMOVE_FROM_CART', payload: productId });
      }
      
      const updatedItems = state.items.map(item =>
        item.productId === productId
          ? { ...item, quantity }
          : item
      );
      
      const totalItems = updatedItems.reduce((total, item) => total + item.quantity, 0);
      const totalPrice = updatedItems.reduce((total, item) => total + (item.price * item.quantity), 0);
      
      return {
        ...state,
        items: updatedItems,
        totalItems,
        totalPrice,
        lastModified: new Date().toISOString()
      };
    }
    
    case 'CLEAR_CART':
      return {
        ...state,
        items: [],
        totalItems: 0,
        totalPrice: 0,
        lastModified: new Date().toISOString()
      };
    
    case 'LOAD_CART':
      return {
        ...state,
        ...action.payload
      };
    
    case 'SET_CART':
      // For loading cart from API
      return {
        ...action.payload,
        lastModified: new Date().toISOString()
      };
    
    default:
      return state;
  }
};

// Initial state matching your MongoDB schema
const initialState = {
  userId: null,
  items: [],
  totalItems: 0,
  totalPrice: 0,
  status: 'active',
  lastModified: new Date().toISOString(),
  version: 0
};

// eslint-disable-next-line react-refresh/only-export-components
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Load cart from localStorage on component mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        dispatch({ type: 'LOAD_CART', payload: parsedCart });
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
        localStorage.removeItem('cart');
      }
    }
  }, []);

  // Save cart to localStorage whenever cart changes - but throttled to prevent excessive saves
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem('cart', JSON.stringify(state));
    }, 100); // Debounce localStorage saves

    return () => clearTimeout(timeoutId);
  }, [state]);

  // Memoize cart actions to prevent unnecessary re-renders
  const addToCart = useCallback((cartData) => {
    dispatch({ type: 'ADD_TO_CART', payload: cartData });
  }, []);

  const removeFromCart = useCallback((productId) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: productId });
  }, []);

  const updateQuantity = useCallback((productId, quantity) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { productId, quantity } });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR_CART' });
  }, []);

  // Set entire cart (useful for loading from API)
  const setCart = useCallback((cartData) => {
    dispatch({ type: 'SET_CART', payload: cartData });
  }, []);

  // Memoize getter functions to prevent unnecessary re-renders
  const getTotalItems = useCallback(() => {
    return state.totalItems;
  }, [state.totalItems]);

  const getTotalPrice = useCallback(() => {
    return state.totalPrice;
  }, [state.totalPrice]);

  const getCartItem = useCallback((productId) => {
    return state.items.find(item => item.productId === productId);
  }, [state.items]);

  // Check if product is in cart
  const isInCart = useCallback((productId) => {
    return state.items.some(item => item.productId === productId);
  }, [state.items]);

  // Get cart item quantity
  const getItemQuantity = useCallback((productId) => {
    const item = state.items.find(item => item.productId === productId);
    return item ? item.quantity : 0;
  }, [state.items]);

  // Memoize the context value to prevent unnecessary re-renders
  const value = {
    // State
    cart: state,
    items: state.items,
    totalItems: state.totalItems,
    totalPrice: state.totalPrice,
    status: state.status,
    
    // Actions
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    setCart,
    
    // Getters
    getTotalItems,
    getTotalPrice,
    getCartItem,
    isInCart,
    getItemQuantity
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
const express = require('express');
const router = express.Router();
const {
    getCart,
    createCart,
    addToCart,
    updateItemQuantity,
    removeFromCart,
    clearCart,
    updateCartStatus,
    syncCart,
    getCartSummary,
    validateCart,
    getAbandonedCarts,
    restoreCart,
    applyCoupon,
    removeCoupon,
    addMultipleItems,
    updateMultipleItems,
    removeMultipleItems
} = require('../controllers/cartController');

// Middleware for authentication (you'll need to implement this)
const auth = require('../middleware/authMiddleware'); // Assuming you have an auth middleware

// Apply authentication middleware to all cart routes
router.use(auth);

// ===================== BASIC CART OPERATIONS =====================

// Get user's cart
router.get('/:userId', getCart);

// Create a new cart
router.post('/', createCart);

// Add item to cart
router.post('/:userId/items', addToCart);

// Update item quantity
router.put('/:userId/items/:productId', updateItemQuantity);

// Remove item from cart
router.delete('/:userId/items/:productId', removeFromCart);

// Clear entire cart
router.delete('/:userId/clear', clearCart);

// ===================== CART MANAGEMENT =====================

// Update cart status
router.put('/:userId/status', updateCartStatus);

// Sync cart with server
router.post('/:userId/sync', syncCart);

// Get cart summary
router.get('/:userId/summary', getCartSummary);

// Validate cart items
router.post('/:userId/validate', validateCart);

// Restore cart from abandoned state
router.put('/:userId/restore', restoreCart);

// ===================== COUPON OPERATIONS =====================

// Apply coupon to cart
router.post('/:userId/coupon', applyCoupon);

// Remove coupon from cart
router.delete('/:userId/coupon', removeCoupon);

// ===================== BULK OPERATIONS =====================

// Add multiple items to cart
router.post('/:userId/items/bulk', addMultipleItems);

// Update multiple items in cart
router.put('/:userId/items/bulk', updateMultipleItems);

// Remove multiple items from cart
router.delete('/:userId/items/bulk', removeMultipleItems);

// ===================== ADMIN/ANALYTICS ROUTES =====================

// Get abandoned carts (admin only)
router.get('/abandoned', getAbandonedCarts); // Note: This route should be before /:userId routes

module.exports = router;
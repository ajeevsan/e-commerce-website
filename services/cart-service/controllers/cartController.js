const Cart = require('../models/Cart');
const { redisClient } = require('../config/cache');

// Helper function to generate cache key
const getCacheKey = (userId) => `cart:${userId}`;

// Helper function to calculate cart totals
const calculateCartTotals = (items) => {
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    return {
        totalItems,
        totalPrice: Math.round(totalPrice * 100) / 100
    };
};

//! Kafka event helper functions
const sendKafkaEvent = async (eventType, eventData, correlationId, userId) => {
  try {
    await kafkaClient.sendProductEvent(eventType, {
      ...eventData,
      correlationId,
      userId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to send Kafka event', {
      error: error.message,
      eventType,
      correlationId,
      userId
    });
  }
};


// Helper function to get cart from cache or database
const getCartFromCacheOrDB = async (userId) => {
    try {
        // Try to get from cache first
        const cachedCart = await redisClient.get(getCacheKey(userId));
        if (cachedCart) {
            const parsedCart = JSON.parse(cachedCart);
            // Convert back to Mongoose document
            return await Cart.findById(parsedCart._id);
        }

        // If not in cache, get from database
        const cart = await Cart.findOne({ userId });
        if (cart) {
            // Cache the cart for 30 minutes (1800 seconds)
            await redisClient.setEx(getCacheKey(userId), 1800, JSON.stringify(cart));
        }
        return cart;
    } catch (error) {
        console.error('Error getting cart from cache/DB:', error);
        // Fallback to database only
        return await Cart.findOne({ userId });
    }
};

// Helper function to update cart in cache
const updateCartCache = async (userId, cart) => {
    try {
        await redisClient.setEx(getCacheKey(userId), 1800, JSON.stringify(cart));
    } catch (error) {
        console.error('Error updating cart cache:', error);
    }
};

// Helper function to clear cart cache
const clearCartCache = async (userId) => {
    try {
        await redisClient.del(getCacheKey(userId));
    } catch (error) {
        console.error('Error clearing cart cache:', error);
    }
};

// Get user's cart
exports.getCart = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }

        const cart = await getCartFromCacheOrDB(userId);

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        res.status(200).json({
            success: true,
            data: cart,
            message: 'Cart retrieved successfully'
        });

    } catch (error) {
        console.error('Error getting cart:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Create new cart
exports.createCart = async (req, res) => {
    try {
        const { userId, items = [], totalItems = 0, totalPrice = 0, status = 'active' } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }

        // Check if cart already exists
        const existingCart = await Cart.findOne({ userId });
        if (existingCart) {
            return res.status(409).json({
                success: false,
                message: 'Cart already exists for this user'
            });
        }

        // Calculate totals from items if provided
        const calculatedTotals = items.length > 0 ? calculateCartTotals(items) : { totalItems, totalPrice };

        const newCart = new Cart({
            userId,
            items,
            totalItems: calculatedTotals.totalItems,
            totalPrice: calculatedTotals.totalPrice,
            status,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        await newCart.save();
        await updateCartCache(userId, newCart);

        res.status(201).json({
            success: true,
            data: newCart,
            message: 'Cart created successfully'
        });

    } catch (error) {
        console.error('Error creating cart:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Add item to cart - FIXED VERSION
exports.addToCart = async (req, res) => {
    try {
        const { userId } = req.params;
        const { productId, quantity = 1, price, productTitle, productImage, stock } = req.body;

        if (!userId || !productId || !price) {
            return res.status(400).json({
                success: false,
                message: 'User ID, product ID, and price are required'
            });
        }

        if (quantity <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Quantity must be greater than 0'
            });
        }

        let cart = await Cart.findOne({ userId });

        if (!cart) {
            // Create new cart if it doesn't exist
            cart = new Cart({
                userId,
                items: [{
                    productId,
                    quantity,
                    price,
                    productTitle,
                    productImage,
                    stock,
                    addedAt: new Date()
                }],
                totalItems: quantity,
                totalPrice: price * quantity,
                status: 'active'
            });
        } else {
            // Update existing cart
            const existingItemIndex = cart.items.findIndex(item => item.productId.toString() === productId.toString());

            if (existingItemIndex > -1) {
                // Update quantity of existing item
                cart.items[existingItemIndex].quantity += quantity;
            } else {
                // Add new item to cart
                cart.items.push({
                    productId,
                    quantity,
                    price,
                    productTitle,
                    productImage,
                    stock,
                    addedAt: new Date()
                });
            }

            // Recalculate totals
            const totals = calculateCartTotals(cart.items);
            cart.totalItems = totals.totalItems;
            cart.totalPrice = totals.totalPrice;
        }

        await cart.save();
        await updateCartCache(userId, cart);

        res.status(200).json({
            success: true,
            data: cart,
            message: 'Item added to cart successfully'
        });

    } catch (error) {
        console.error('Error adding to cart:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

//! update item quantity in cart - FIXED VERSION
exports.updateItemQuantity = async (req, res) => {
    try {
        const { userId, productId } = req.params;
        const { quantity } = req.body;

        if (!userId || !productId || quantity === undefined) {
            return res.status(400).json({
                success: false,
                message: 'User ID, product ID, and quantity are required'
            });
        }

        if (quantity < 0) {
            return res.status(400).json({
                success: false,
                message: 'Quantity cannot be negative'
            });
        }

        const cart = await Cart.findOne({ userId });

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId.toString());

        if (itemIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Item not found in cart'
            });
        }

        if (quantity === 0) {
            // Remove item if quantity is 0
            cart.items.splice(itemIndex, 1);
        } else {
            // Update quantity
            cart.items[itemIndex].quantity = quantity;
        }

        // Recalculate totals
        const totals = calculateCartTotals(cart.items);
        cart.totalItems = totals.totalItems;
        cart.totalPrice = totals.totalPrice;

        await cart.save();
        await updateCartCache(userId, cart);

        res.status(200).json({
            success: true,
            data: cart,
            message: 'Item quantity updated successfully'
        });

    } catch (error) {
        console.error('Error updating item quantity:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Remove item from cart - FIXED VERSION
exports.removeFromCart = async (req, res) => {
    try {
        const { userId, productId } = req.params;

        if (!userId || !productId) {
            return res.status(400).json({
                success: false,
                message: 'User ID and product ID are required'
            });
        }

        const cart = await Cart.findOne({ userId });

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId.toString());

        if (itemIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Item not found in cart'
            });
        }

        // Remove item
        cart.items.splice(itemIndex, 1);

        // Recalculate totals
        const totals = calculateCartTotals(cart.items);
        cart.totalItems = totals.totalItems;
        cart.totalPrice = totals.totalPrice;

        await cart.save();
        await updateCartCache(userId, cart);

        res.status(200).json({
            success: true,
            data: cart,
            message: 'Item removed from cart successfully'
        });

    } catch (error) {
        console.error('Error removing from cart:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Clear entire cart - FIXED VERSION
exports.clearCart = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }

        const cart = await Cart.findOne({ userId });

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        // Clear all items
        cart.items = [];
        cart.totalItems = 0;
        cart.totalPrice = 0;

        await cart.save();
        await updateCartCache(userId, cart);

        res.status(200).json({
            success: true,
            data: cart,
            message: 'Cart cleared successfully'
        });

    } catch (error) {
        console.error('Error clearing cart:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Update cart status - FIXED VERSION
exports.updateCartStatus = async (req, res) => {
    try {
        const { userId } = req.params;
        const { status } = req.body;

        if (!userId || !status) {
            return res.status(400).json({
                success: false,
                message: 'User ID and status are required'
            });
        }

        const validStatuses = ['active', 'abandoned', 'converted', 'expired'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be one of: active, abandoned, converted, expired'
            });
        }

        const cart = await Cart.findOne({ userId });

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        cart.status = status;

        await cart.save();
        await updateCartCache(userId, cart);

        res.status(200).json({
            success: true,
            data: cart,
            message: 'Cart status updated successfully'
        });

    } catch (error) {
        console.error('Error updating cart status:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Sync cart with server - FIXED VERSION
exports.syncCart = async (req, res) => {
    try {
        const { userId } = req.params;
        const { items, totalItems, totalPrice, status } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }

        let cart = await Cart.findOne({ userId });

        if (!cart) {
            // Create new cart if it doesn't exist
            cart = new Cart({
                userId,
                items: items || [],
                totalItems: totalItems || 0,
                totalPrice: totalPrice || 0,
                status: status || 'active'
            });
        } else {
            // Merge local cart with server cart
            const serverItems = cart.items;
            const localItems = items || [];

            // Create a map of server items for easy lookup
            const serverItemsMap = new Map(serverItems.map(item => [item.productId.toString(), item]));

            // Merge items
            const mergedItems = [];
            
            // Add all local items, updating quantities if they exist on server
            localItems.forEach(localItem => {
                const serverItem = serverItemsMap.get(localItem.productId.toString());
                if (serverItem) {
                    // Item exists on server, use the most recent timestamp
                    const localTimestamp = new Date(localItem.updatedAt || localItem.addedAt);
                    const serverTimestamp = new Date(serverItem.updatedAt || serverItem.addedAt);
                    
                    if (localTimestamp > serverTimestamp) {
                        mergedItems.push(localItem);
                    } else {
                        mergedItems.push(serverItem);
                    }
                    serverItemsMap.delete(localItem.productId.toString());
                } else {
                    // Item doesn't exist on server, add from local
                    mergedItems.push(localItem);
                }
            });

            // Add remaining server items that weren't in local cart
            serverItemsMap.forEach(serverItem => {
                mergedItems.push(serverItem);
            });

            cart.items = mergedItems;
        }

        // Recalculate totals
        const totals = calculateCartTotals(cart.items);
        cart.totalItems = totals.totalItems;
        cart.totalPrice = totals.totalPrice;

        await cart.save();
        await updateCartCache(userId, cart);

        res.status(200).json({
            success: true,
            data: cart,
            message: 'Cart synced successfully'
        });

    } catch (error) {
        console.error('Error syncing cart:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Get cart summary - FIXED VERSION
exports.getCartSummary = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }

        const cart = await Cart.findOne({ userId });

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        const summary = {
            userId: cart.userId,
            totalItems: cart.totalItems,
            totalPrice: cart.totalPrice,
            itemCount: cart.items.length,
            status: cart.status,
            lastUpdated: cart.updatedAt
        };

        res.status(200).json({
            success: true,
            data: summary,
            message: 'Cart summary retrieved successfully'
        });

    } catch (error) {
        console.error('Error getting cart summary:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Validate cart items
exports.validateCart = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }

        const cart = await Cart.findOne({ userId });

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        // Here you would typically validate against product service
        // For now, we'll just return the cart as valid
        const validation = {
            isValid: true,
            invalidItems: [],
            outOfStockItems: [],
            priceChanges: []
        };

        // TODO: Implement actual validation logic
        // - Check product availability
        // - Verify current prices
        // - Check stock levels

        res.status(200).json({
            success: true,
            data: validation,
            message: 'Cart validation completed'
        });

    } catch (error) {
        console.error('Error validating cart:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Get abandoned carts
exports.getAbandonedCarts = async (req, res) => {
    try {
        const { page = 1, limit = 10, days = 7 } = req.query;

        const dateThreshold = new Date();
        dateThreshold.setDate(dateThreshold.getDate() - parseInt(days));

        const abandonedCarts = await Cart.find({
            status: 'abandoned',
            updatedAt: { $lt: dateThreshold }
        })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit))
        .sort({ updatedAt: -1 });

        const total = await Cart.countDocuments({
            status: 'abandoned',
            updatedAt: { $lt: dateThreshold }
        });

        res.status(200).json({
            success: true,
            data: {
                carts: abandonedCarts,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / parseInt(limit)),
                    totalItems: total,
                    hasNextPage: parseInt(page) < Math.ceil(total / parseInt(limit)),
                    hasPreviousPage: parseInt(page) > 1
                }
            },
            message: 'Abandoned carts retrieved successfully'
        });

    } catch (error) {
        console.error('Error getting abandoned carts:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Restore cart from abandoned state - FIXED VERSION
exports.restoreCart = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }

        const cart = await Cart.findOne({ userId });

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        cart.status = 'active';

        await cart.save();
        await updateCartCache(userId, cart);

        res.status(200).json({
            success: true,
            data: cart,
            message: 'Cart restored successfully'
        });

    } catch (error) {
        console.error('Error restoring cart:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Apply coupon to cart - FIXED VERSION
exports.applyCoupon = async (req, res) => {
    try {
        const { userId } = req.params;
        const { couponCode } = req.body;

        if (!userId || !couponCode) {
            return res.status(400).json({
                success: false,
                message: 'User ID and coupon code are required'
            });
        }

        const cart = await Cart.findOne({ userId });

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        // TODO: Implement coupon validation logic
        // For now, we'll simulate a 10% discount
        const discountPercentage = 10;
        const discountAmount = (cart.totalPrice * discountPercentage) / 100;

        cart.coupon = {
            code: couponCode,
            discountPercentage,
            discountAmount: Math.round(discountAmount * 100) / 100
        };

        await cart.save();
        await updateCartCache(userId, cart);

        res.status(200).json({
            success: true,
            data: cart,
            message: 'Coupon applied successfully'
        });

    } catch (error) {
        console.error('Error applying coupon:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Remove coupon from cart - FIXED VERSION
exports.removeCoupon = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }

        const cart = await Cart.findOne({ userId });

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        cart.coupon = undefined;

        await cart.save();
        await updateCartCache(userId, cart);

        res.status(200).json({
            success: true,
            data: cart,
            message: 'Coupon removed successfully'
        });

    } catch (error) {
        console.error('Error removing coupon:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Bulk operations - FIXED VERSION
exports.addMultipleItems = async (req, res) => {
    try {
        const { userId } = req.params;
        const { items } = req.body;

        if (!userId || !items || !Array.isArray(items)) {
            return res.status(400).json({
                success: false,
                message: 'User ID and items array are required'
            });
        }

        let cart = await Cart.findOne({ userId });

        if (!cart) {
            cart = new Cart({
                userId,
                items: [],
                totalItems: 0,
                totalPrice: 0,
                status: 'active'
            });
        }

        // Add each item
        items.forEach(item => {
            const { productId, quantity, price, productTitle, productImage, stock } = item;
            
            if (!productId || !quantity || !price) return;

            const existingItemIndex = cart.items.findIndex(cartItem => cartItem.productId.toString() === productId.toString());

            if (existingItemIndex > -1) {
                cart.items[existingItemIndex].quantity += quantity;
            } else {
                cart.items.push({
                    productId,
                    quantity,
                    price,
                    productTitle,
                    productImage,
                    stock,
                    addedAt: new Date()
                });
            }
        });

        // Recalculate totals
        const totals = calculateCartTotals(cart.items);
        cart.totalItems = totals.totalItems;
        cart.totalPrice = totals.totalPrice;

        await cart.save();
        await updateCartCache(userId, cart);

        res.status(200).json({
            success: true,
            data: cart,
            message: 'Items added to cart successfully'
        });

    } catch (error) {
        console.error('Error adding multiple items:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

exports.updateMultipleItems = async (req, res) => {
    try {
        const { userId } = req.params;
        const { updates } = req.body;

        if (!userId || !updates || !Array.isArray(updates)) {
            return res.status(400).json({
                success: false,
                message: 'User ID and updates array are required'
            });
        }

        const cart = await Cart.findOne({ userId });

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        // Update each item
        updates.forEach(update => {
            const { productId, quantity } = update;
            
            if (!productId || quantity === undefined) return;

            const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId.toString());

            if (itemIndex > -1) {
                if (quantity === 0) {
                    cart.items.splice(itemIndex, 1);
                } else {
                    cart.items[itemIndex].quantity = quantity;
                }
            }
        });

        // Recalculate totals
        const totals = calculateCartTotals(cart.items);
        cart.totalItems = totals.totalItems;
        cart.totalPrice = totals.totalPrice;

        await cart.save();
        await updateCartCache(userId, cart);

        res.status(200).json({
            success: true,
            data: cart,
            message: 'Items updated successfully'
        });

    } catch (error) {
        console.error('Error updating multiple items:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

exports.removeMultipleItems = async (req, res) => {
    try {
        const { userId } = req.params;
        const { productIds } = req.body;

        if (!userId || !productIds || !Array.isArray(productIds)) {
            return res.status(400).json({
                success: false,
                message: 'User ID and product IDs array are required'
            });
        }

        const cart = await Cart.findOne({ userId });

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        // Remove items
        cart.items = cart.items.filter(item => !productIds.includes(item.productId.toString()));

        // Recalculate totals
        const totals = calculateCartTotals(cart.items);
        cart.totalItems = totals.totalItems;
        cart.totalPrice = totals.totalPrice;

        await cart.save();
        await updateCartCache(userId, cart);

        res.status(200).json({
            success: true,
            data: cart,
            message: 'Items removed successfully'
        });

    } catch (error) {
        console.error('Error removing multiple items:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};
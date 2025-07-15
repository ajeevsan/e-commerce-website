const mongoose = require('mongoose')

const cartSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    items: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1,
            max: 100 // Prevent abuse
        },
        price: {
            type: Number,
            required: true
        },
        // Cache product details to avoid joins
        productTitle: {
            type: String,
            required: false // Changed from true to false since controller doesn't always provide it
        },
        productImage: {
            type: String,
            required: false // Changed from true to false since controller doesn't always provide it
        },
        // Add stock field that controller uses
        stock: {
            type: Number,
            required: false
        },
        addedAt: {
            type: Date,
            default: Date.now
        },
        // Add updatedAt field for sync functionality
        updatedAt: {
            type: Date,
            default: Date.now
        }
    }],
    totalItems: { 
        type: Number, 
        default: 0 
    },
    totalPrice: { 
        type: Number, 
        default: 0
    },
    status: {
        type: String,
        enum: ['active', 'abandoned', 'converted', 'expired'],
        default: 'active'
    },
    // Add coupon field that controller uses
    coupon: {
        code: {
            type: String,
            required: false
        },
        discountPercentage: {
            type: Number,
            required: false
        },
        discountAmount: {
            type: Number,
            required: false
        }
    },
    lastModified: {
        type: Date,
        default: Date.now
    },
    expiresAt: {
        type: Date,
        default: Date.now,
        expires: 2592000 // 30 days
    },
    // Add versioning for optimistic locking
    version: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true, // This provides createdAt and updatedAt automatically
    // Optimize document size
    minimize: false
})

// Compound indexes for better performance
cartSchema.index({ userId: 1, status: 1 })
cartSchema.index({ 'items.productId': 1, userId: 1 })
cartSchema.index({ expiresAt: 1 })
cartSchema.index({ lastModified: 1 })
cartSchema.index({ status: 1, lastModified: 1 }) // For analytics
cartSchema.index({ status: 1, updatedAt: 1 }) // For abandoned cart queries

// Pre-save middleware with validation
cartSchema.pre('save', function(next) {
    // Limit items to prevent abuse
    if (this.items.length > 50) {
        return next(new Error('Cart cannot exceed 50 items'))
    }
    
    // Calculate totals (controller also does this, but keeping as backup)
    this.totalItems = this.items.reduce((total, item) => total + item.quantity, 0)
    this.totalPrice = Math.round(this.items.reduce((total, item) => total + (item.price * item.quantity), 0) * 100) / 100
    this.lastModified = new Date()
    this.version += 1
    
    // Update updatedAt for each item when cart is saved
    this.items.forEach(item => {
        if (item.isModified || item.isNew) {
            item.updatedAt = new Date()
        }
    })
    
    next()
})

// Methods for better performance
cartSchema.methods.findItemIndex = function(productId) {
    return this.items.findIndex(item => item.productId.toString() === productId.toString())
}

cartSchema.methods.addItem = function(product, quantity = 1) {
    const itemIndex = this.findItemIndex(product._id || product.productId)
    
    if (itemIndex > -1) {
        this.items[itemIndex].quantity += quantity
        this.items[itemIndex].updatedAt = new Date()
    } else {
        this.items.push({
            productId: product._id || product.productId,
            quantity,
            price: product.price,
            productTitle: product.title || product.productTitle,
            productImage: product.thumbnail || product.productImage || (product.images && product.images[0]),
            stock: product.stock,
            addedAt: new Date(),
            updatedAt: new Date()
        })
    }
}

cartSchema.methods.removeItem = function(productId) {
    this.items = this.items.filter(item => item.productId.toString() !== productId.toString())
}

cartSchema.methods.updateItemQuantity = function(productId, quantity) {
    const itemIndex = this.findItemIndex(productId)
    if (itemIndex > -1) {
        if (quantity <= 0) {
            this.removeItem(productId)
        } else {
            this.items[itemIndex].quantity = quantity
            this.items[itemIndex].updatedAt = new Date()
        }
    }
}

// Method to get cart summary (used by controller)
cartSchema.methods.getSummary = function() {
    return {
        userId: this.userId,
        totalItems: this.totalItems,
        totalPrice: this.totalPrice,
        itemCount: this.items.length,
        status: this.status,
        lastUpdated: this.updatedAt
    }
}

// Method to validate cart items (placeholder for future implementation)
cartSchema.methods.validateItems = function() {
    return {
        isValid: true,
        invalidItems: [],
        outOfStockItems: [],
        priceChanges: []
    }
}

// Static method to find abandoned carts
cartSchema.statics.findAbandonedCarts = function(days = 7, page = 1, limit = 10) {
    const dateThreshold = new Date()
    dateThreshold.setDate(dateThreshold.getDate() - days)
    
    return this.find({
        status: 'abandoned',
        updatedAt: { $lt: dateThreshold }
    })
    .limit(limit)
    .skip((page - 1) * limit)
    .sort({ updatedAt: -1 })
}

// Static method to count abandoned carts
cartSchema.statics.countAbandonedCarts = function(days = 7) {
    const dateThreshold = new Date()
    dateThreshold.setDate(dateThreshold.getDate() - days)
    
    return this.countDocuments({
        status: 'abandoned',
        updatedAt: { $lt: dateThreshold }
    })
}

module.exports = mongoose.model('Cart', cartSchema)
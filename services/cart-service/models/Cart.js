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
            required: true
        },
        productImage: {
            type: String,
            required: true
        },
        // Add stock field to match controller
        stock: {
            type: Number,
            default: 0
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
    // Add coupon field to match controller
    coupon: {
        code: {
            type: String
        },
        discountPercentage: {
            type: Number,
            min: 0,
            max: 100
        },
        discountAmount: {
            type: Number,
            min: 0
        }
    },
    lastModified: {
        type: Date,
        default: Date.now
    },
    // Remove the default and expires from expiresAt to fix the duplicate index warning
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    },
    // Add versioning for optimistic locking
    version: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true, // This provides createdAt and updatedAt automatically
    minimize: false
})

// Create TTL index manually to avoid duplicate index warning
cartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

// Compound indexes for better performance
cartSchema.index({ userId: 1, status: 1 })
cartSchema.index({ 'items.productId': 1, userId: 1 })
cartSchema.index({ lastModified: 1 })
cartSchema.index({ status: 1, lastModified: 1 }) // For analytics

// Pre-save middleware with validation
cartSchema.pre('save', function(next) {
    // Limit items to prevent abuse
    if (this.items.length > 50) {
        return next(new Error('Cart cannot exceed 50 items'))
    }
    
    // Calculate totals
    this.totalItems = this.items.reduce((total, item) => total + item.quantity, 0)
    this.totalPrice = this.items.reduce((total, item) => total + (item.price * item.quantity), 0)
    
    // Round totalPrice to 2 decimal places to match controller
    this.totalPrice = Math.round(this.totalPrice * 100) / 100
    
    this.lastModified = new Date()
    this.version += 1
    
    // Update expiresAt to extend cart life on activity
    this.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    
    next()
})

// Update item updatedAt timestamp when items are modified
cartSchema.pre('save', function(next) {
    if (this.isModified('items')) {
        this.items.forEach(item => {
            if (item.isModified() || item.isNew) {
                item.updatedAt = new Date()
            }
        })
    }
    next()
})

// Methods for better performance
cartSchema.methods.findItemIndex = function(productId) {
    return this.items.findIndex(item => item.productId.toString() === productId.toString())
}

cartSchema.methods.addItem = function(product, quantity = 1) {
    const itemIndex = this.findItemIndex(product._id)
    
    if (itemIndex > -1) {
        this.items[itemIndex].quantity += quantity
        this.items[itemIndex].updatedAt = new Date()
    } else {
        this.items.push({
            productId: product._id,
            quantity,
            price: product.price,
            productTitle: product.title,
            productImage: product.thumbnail || product.images[0],
            stock: product.stock || 0,
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

// Method to clear cart
cartSchema.methods.clearCart = function() {
    this.items = []
    this.totalItems = 0
    this.totalPrice = 0
    this.coupon = undefined
}

// Method to apply coupon
cartSchema.methods.applyCoupon = function(couponCode, discountPercentage) {
    const discountAmount = (this.totalPrice * discountPercentage) / 100
    this.coupon = {
        code: couponCode,
        discountPercentage,
        discountAmount: Math.round(discountAmount * 100) / 100
    }
}

// Method to remove coupon
cartSchema.methods.removeCoupon = function() {
    this.coupon = undefined
}

// Method to get final price after discount
cartSchema.methods.getFinalPrice = function() {
    if (this.coupon && this.coupon.discountAmount) {
        return Math.round((this.totalPrice - this.coupon.discountAmount) * 100) / 100
    }
    return this.totalPrice
}

// Static method to find abandoned carts
cartSchema.statics.findAbandonedCarts = function(days = 7) {
    const dateThreshold = new Date()
    dateThreshold.setDate(dateThreshold.getDate() - days)
    
    return this.find({
        status: 'abandoned',
        updatedAt: { $lt: dateThreshold }
    })
}

// Static method to cleanup expired carts
cartSchema.statics.cleanupExpiredCarts = function() {
    return this.deleteMany({
        expiresAt: { $lt: new Date() }
    })
}

module.exports = mongoose.model('Cart', cartSchema)
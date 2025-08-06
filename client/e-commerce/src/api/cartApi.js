import axios from 'axios';
import Cookies from "js-cookie";

const BASE_URL = import.meta.env.VITE_API_GATEWAY_URL;

class CartService {
    constructor(){
        this.baseURL = BASE_URL
        this.axiosInstance = this.createAxiosInstance()
        this.token = Cookies.get('token')
        this.setupInterceptors()
    }

    createAxiosInstance(){
        return axios.create({
            baseURL: this.baseURL,
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json'
            }
        })
    }

    setupInterceptors(){
        this.axiosInstance.interceptors.request.use(
            (config) => {
                const token = Cookies.get('token')
                if(token){
                    config.headers.Authorization = `Bearer ${token}`
                }
                return config;
            },

            (error) => {
                return Promise.reject(error)
            }
        )

        //! response interceptor to handle common errors
        this.axiosInstance.interceptors.response.use(
            (response) => response,
            (error) => {
                if(error.response?.status === 401){
                    Cookies.remove('token')
                    window.location = '/login'
                }
                return Promise.reject(error)
            }
        )
    }

    getAuthHeaders(){
        const token = Cookies.get('token')
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    }

    //! generate request methods 
    async request(endpoint, options={}){
        try {
            const response = await this.axiosInstance.request({
                url: endpoint, 
                ...options
            })
            return response.data;
        } catch (error) {
            console.error('API request error: ', error)
            throw this.handleError(error)
        }
    }

    //! error handler
    handleError(error){
        if(error.response){
            //! server responded with server error
            return {
                success: false,
                message: error.response.data?.message || 'server error',
                status: error.response.status,
                data: null
            }
        } else if(error.request){
            //! network error
            return {
                success: false,
                message: 'network error. Please check your connection',
                status: 0,
                data: null
            }
        } else {
            //! other error
            return {
                success: false,
                message: error.message || 'An unexpected error occured',
                status: 0,
                data: null
            }
        }
    }

    // ===================== CART API METHODS =====================

    /**
     * Get user's cart
     * @param {string} userId - User ID
     * @returns {Promise} Cart data
     */
    async getCart(userId) {
        return this.request(`/cart/${userId}`, {
            method: 'GET'
        });
    }

    /**
     * Create a new cart for user
     * @param {Object} cartData - Cart data with userId and items
     * @returns {Promise} Created cart
     */
    async createCart(cartData) {
        return this.request('/cart', {
            method: 'POST',
            data: cartData
        });
    }

    /**
     * Add item to cart
     * @param {string} userId - User ID
     * @param {Object} itemData - Item data (productId, quantity, price, etc.)
     * @returns {Promise} Updated cart
     */
    async addToCart(userId, itemData) {
        return this.request(`/cart/${userId}/items`, {
            method: 'POST',
            data: itemData
        });
    }

    /**
     * Update item quantity in cart
     * @param {string} userId - User ID
     * @param {string} productId - Product ID
     * @param {number} quantity - New quantity
     * @returns {Promise} Updated cart
     */
    async updateItemQuantity(userId, productId, quantity) {
        return this.request(`/cart/${userId}/items/${productId}`, {
            method: 'PUT',
            data: { quantity }
        });
    }

    /**
     * Remove item from cart
     * @param {string} userId - User ID
     * @param {string} productId - Product ID
     * @returns {Promise} Updated cart
     */
    async removeFromCart(userId, productId) {
        return this.request(`/cart/${userId}/items/${productId}`, {
            method: 'DELETE'
        });
    }

    /**
     * Clear entire cart
     * @param {string} userId - User ID
     * @returns {Promise} Empty cart
     */
    async clearCart(userId) {
        return this.request(`/cart/${userId}/clear`, {
            method: 'DELETE'
        });
    }

    /**
     * Update cart status (active, abandoned, converted, expired)
     * @param {string} userId - User ID
     * @param {string} status - New status
     * @returns {Promise} Updated cart
     */
    async updateCartStatus(userId, status) {
        return this.request(`/cart/${userId}/status`, {
            method: 'PUT',
            data: { status }
        });
    }

    /**
     * Sync local cart with server cart
     * @param {string} userId - User ID
     * @param {Object} localCartData - Local cart data to sync
     * @returns {Promise} Merged cart
     */
    async syncCart(userId, localCartData) {
        return this.request(`/cart/${userId}/sync`, {
            method: 'POST',
            data: localCartData
        });
    }

    /**
     * Get cart summary (totals only)
     * @param {string} userId - User ID
     * @returns {Promise} Cart summary
     */
    async getCartSummary(userId) {
        return this.request(`/cart/${userId}/summary`, {
            method: 'GET'
        });
    }

    /**
     * Validate cart items (check stock, prices, etc.)
     * @param {string} userId - User ID
     * @returns {Promise} Validation results
     */
    async validateCart(userId) {
        return this.request(`/cart/${userId}/validate`, {
            method: 'POST'
        });
    }

    /**
     * Get abandoned carts (admin/analytics)
     * @param {Object} filters - Filter options
     * @returns {Promise} Abandoned carts
     */
    async getAbandonedCarts(filters = {}) {
        const queryParams = new URLSearchParams(filters).toString();
        return this.request(`/cart/abandoned${queryParams ? `?${queryParams}` : ''}`, {
            method: 'GET'
        });
    }

    /**
     * Restore cart from abandoned state
     * @param {string} userId - User ID
     * @returns {Promise} Restored cart
     */
    async restoreCart(userId) {
        return this.request(`/cart/${userId}/restore`, {
            method: 'PUT'
        });
    }

    /**
     * Apply discount/coupon to cart
     * @param {string} userId - User ID
     * @param {string} couponCode - Coupon code
     * @returns {Promise} Updated cart with discount
     */
    async applyCoupon(userId, couponCode) {
        return this.request(`/cart/${userId}/coupon`, {
            method: 'POST',
            data: { couponCode }
        });
    }

    /**
     * Remove coupon from cart
     * @param {string} userId - User ID
     * @returns {Promise} Updated cart without discount
     */
    async removeCoupon(userId) {
        return this.request(`/cart/${userId}/coupon`, {
            method: 'DELETE'
        });
    }

    // ===================== CONVENIENCE METHODS =====================

    /**
     * Add multiple items to cart at once
     * @param {string} userId - User ID
     * @param {Array} items - Array of item objects
     * @returns {Promise} Updated cart
     */
    async addMultipleItems(userId, items) {
        return this.request(`/cart/${userId}/items/bulk`, {
            method: 'POST',
            data: { items }
        });
    }

    /**
     * Update multiple items in cart
     * @param {string} userId - User ID
     * @param {Array} updates - Array of {productId, quantity} objects
     * @returns {Promise} Updated cart
     */
    async updateMultipleItems(userId, updates) {
        return this.request(`/cart/${userId}/items/bulk`, {
            method: 'PUT',
            data: { updates }
        });
    }

    /**
     * Remove multiple items from cart
     * @param {string} userId - User ID
     * @param {Array} productIds - Array of product IDs to remove
     * @returns {Promise} Updated cart
     */
    async removeMultipleItems(userId, productIds) {
        return this.request(`/cart/${userId}/items/bulk`, {
            method: 'DELETE',
            data: { productIds }
        });
    }

    /**
     * Check if cart exists for user
     * @param {string} userId - User ID
     * @returns {Promise} Boolean indicating cart existence
     */
    async cartExists(userId) {
        try {
            await this.getCart(userId);
            return true;
        } catch (error) {
            if (error.status === 404) {
                return false;
            }
            throw error;
        }
    }

    /**
     * Get or create cart for user
     * @param {string} userId - User ID
     * @returns {Promise} Cart data
     */
    async getOrCreateCart(userId) {
        try {
            return await this.getCart(userId);
        } catch (error) {
            if (error.status === 404) {
                // Cart doesn't exist, create new one
                return await this.createCart({
                    userId,
                    items: [],
                    totalItems: 0,
                    totalPrice: 0,
                    status: 'active'
                });
            }
            throw error;
        }
    }

    // ===================== HELPER METHODS =====================

    /**
     * Calculate cart totals locally (for validation)
     * @param {Array} items - Cart items
     * @returns {Object} Calculated totals
     */
    calculateTotals(items) {
        const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
        const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        return {
            totalItems,
            totalPrice: Math.round(totalPrice * 100) / 100 // Round to 2 decimal places
        };
    }

    /**
     * Format cart data for API consumption
     * @param {Object} rawCartData - Raw cart data from frontend
     * @returns {Object} Formatted cart data
     */
    formatCartData(rawCartData) {
        return {
            userId: rawCartData.userId,
            items: rawCartData.items.map(item => ({
                productId: item.productId || item.id,
                quantity: item.quantity,
                price: item.price,
                productTitle: item.productTitle || item.title,
                productImage: item.productImage || item.thumbnail,
                addedAt: item.addedAt || new Date().toISOString()
            })),
            totalItems: rawCartData.totalItems,
            totalPrice: rawCartData.totalPrice,
            status: rawCartData.status || 'active'
        };
    }
}

// Create and export a singleton instance
const cartService = new CartService();
export default cartService;
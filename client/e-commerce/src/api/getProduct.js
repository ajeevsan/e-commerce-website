import axios from 'axios';
import Cookies from "js-cookie";

const BASE_URL = import.meta.env.VITE_API_PRODUCTS_URL || 'http://localhost:3001';

class ApiService {
    constructor() {
        this.baseURL = BASE_URL;
        this.axiosInstance = this.createAxiosInstance();
        this.token = Cookies.get('token')
    }

    createAxiosInstance() {
        return axios.create({
            baseURL: this.baseURL,
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json',
            }
        });
    }

    setupInterceptors(){
        this.axiosInstance.interceptors.request.use(
            (config) => {
                const token = Cookies.get('token')
                if(token){
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },

            (error) => {
                return Promise.reject(error)
            }
        );
        //! response interceptor to handle common errors
        this.axiosInstance.interceptors.response.use(
            (response) => response, 
            (error) => {
                if(error.response?.status === 401){
                    Cookies.remove('token');
                    window.location('/login')
                }
                return Promise.reject(error)
            }
        )
    }


    getAuthHeaders() {
        const token = Cookies.get('token')
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    }

    //! generate request methods
    async request(endpoint, options={}){
        try {
            const response = await this.axiosInstance.request({
                url: endpoint,
                ...options
            })

            return response.data
        } catch (error) {
            console.error('API request error: ', error)
            throw this.handleError(error)
        }
    }

    //! error handler
    handleError(error) {
        if(error.response){
            //! server responded with server error 
            return {
                success: false,
                message: error.response.data?.message || 'server Error',
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

    //! get all prodcuts api
    async getAllProducts(options = {}){
        const {page=1, limit=20, search=''} = options;
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            ...(search && {search})
        })

        return this.request(`/products/all/${params}`)
    }

    //! get products by category
    async getProductsByCategory(category, options={}){
        const {page= 1, limit=20, search=''} = options
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            ...(search && {search})
        })

        return this.request(`/products/category/${category}?${params}`)
    }

    //! get products by id
    async getProductsById(id){
        return this.request(`/products/product/${id}`)
    }

    //! get featured products 
    async getFeaturedProducts(limit=10){
        return this.request(`/products/featured?limit=${limit}`)
    }

    //! get all categories
    async getCategories(){
        return this.request(`/products/categories`)
    }

    //! get offers/discounted products
    async getOffers(limit=20){
        return this.request(`/products/offers?limits=${limit}`)
    }

    updateToken(newToken){
        Cookies.set('token', newToken, {
            expires: 7, 
            secure: true,
            sameSite: 'strict'
        });
    }

    //! Clear token (when user logs out)
    clearToken(){
        Cookies.remove('token')
    } 

    //! check if user is authenticated
    isAuthenticated(){
        return !!Cookies.get('token')
    }

    //! get token
    getToken(){
        return Cookies.gett('token')
    }
}

export default new ApiService


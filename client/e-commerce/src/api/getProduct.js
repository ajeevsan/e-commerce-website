import axios from 'axios';
import Cookies from "js-cookie";

const BASE_URL = import.meta.env.VITE_BASE_URL;

class ApiService {
    constructor() {
        this.baseURL = BASE_URL;
        this.token = Cookies.get('token')
    }

    getAuthHeaders() {
        return {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
        };
    }
}
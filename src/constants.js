/**
 * Centralized API and Domain Configuration
 */

// The base URL for the FastAPI backend
export const FASTAPI_BASE = 'https://fastapiratehawk.co.uk';

// The base URL for your local proxy server (Express)
// If you deploy this, change it to your production domain or use an environment variable
export const API_BASE_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:5000'
    : ''; // Empty string means it will use the current domain (for production)

// Combined API path for the proxy
export const PROXY_API_PATH = `${API_BASE_URL}/api`;

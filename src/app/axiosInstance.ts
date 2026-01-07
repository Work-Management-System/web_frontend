import axios, {
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
  AxiosHeaders,
} from 'axios';
import Cookies from 'js-cookie';

const createAxiosInstance = (): AxiosInstance => {
  const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL;
  
  if (!baseURL) {
    console.error('NEXT_PUBLIC_API_BASE_URL is not set in environment variables');
    throw new Error('API base URL is not configured. Please set NEXT_PUBLIC_API_BASE_URL in your .env file');
  }

  const instance = axios.create({
    baseURL: baseURL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  
  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
        const accessToken = Cookies.get('access_token');
        let tenant = Cookies.get('tenant');

        // If tenant not in cookie, try to get from URL (for set-password page)
        if (!tenant && typeof window !== 'undefined') {
          const urlParams = new URLSearchParams(window.location.search);
          tenant = urlParams.get('tenant') || null;
          
          // Also try to extract from hostname (only if it's a valid subdomain)
          if (!tenant) {
            const hostname = window.location.hostname;
            
            // Skip extraction for plain localhost or 127.0.0.1 (no subdomain)
            if (hostname === 'localhost' || hostname === '127.0.0.1') {
              tenant = null; // Explicitly set to null to avoid setting header
            } else if (hostname.includes('localhost')) {
              // For subdomain.localhost:3000 format
              const parts = hostname.split('.');
              if (parts.length >= 2 && parts[0] !== 'localhost' && parts[0] !== '127') {
                tenant = parts[0];
              }
            } else {
              // For production domains: subdomain.example.com
              const parts = hostname.split('.');
              if (parts.length > 2 && parts[0] !== 'www') {
                tenant = parts[0];
              }
            }
          }
          
          // Set in cookie if found (and not null)
          if (tenant) {
            Cookies.set('tenant', tenant, { expires: 7 });
          }
        }

        if (!config.headers || !(config.headers instanceof axios.AxiosHeaders)) {
          config.headers = new axios.AxiosHeaders();
        }

        if (accessToken) {
          config.headers.set('Authorization', `Bearer ${accessToken}`);
        }

        if (tenant) {
          config.headers.set('tenant', tenant);
          console.log('Tenant header set:', tenant);
        } else {
          console.warn('No tenant found for request');
        }
      

      return config;
    },
    (error) => Promise.reject(error)
  );

  
  instance.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: any) => Promise.reject(error)
  );

  return instance;
};

export default createAxiosInstance;

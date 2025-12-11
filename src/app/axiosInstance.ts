import axios, {
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
  AxiosHeaders,
} from 'axios';
import Cookies from 'js-cookie';

const createAxiosInstance = (): AxiosInstance => {
  const instance = axios.create({
    // baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.manazeit.com/api/v1',
    // baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://49.13.206.109:9003/api/v1',
    baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.manazeit.com/api/v1',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  
  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
        const accessToken = Cookies.get('access_token');
        const tenant = Cookies.get('tenant');

        if (!config.headers || !(config.headers instanceof axios.AxiosHeaders)) {
          config.headers = new axios.AxiosHeaders();
        }

        if (accessToken) {
          config.headers.set('Authorization', `Bearer ${accessToken}`);
        }

        if (tenant) {
          config.headers.set('tenant', tenant);
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

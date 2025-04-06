import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, loadApiBaseUrl } from '../config/api';

// 创建一个Axios实例
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10秒超时
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// 请求拦截器
apiClient.interceptors.request.use(
  async (config) => {
    // 从存储中获取最新的API_BASE_URL
    try {
      const baseUrl = await loadApiBaseUrl();
      config.baseURL = baseUrl;
    } catch (error) {
      console.error('获取API_BASE_URL失败', error);
      // 出错时使用默认值
      config.baseURL = API_BASE_URL;
    }
    
    // 从存储中获取token
    const token = await AsyncStorage.getItem('auth_token');
    
    // 如果token存在，添加到请求头
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // 如果是401错误且没有重试过，尝试刷新token
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // 在实际应用中，这里应该调用刷新token的接口
        // 由于当前后端没有刷新token的接口，这里简单处理为清除token并返回错误
        await AsyncStorage.removeItem('auth_token');
        
        // 重定向到登录页的逻辑会在组件中处理
        return Promise.reject(error);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// API方法
export const api = {
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return apiClient.get<T>(url, config);
  },
  
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return apiClient.post<T>(url, data, config);
  },
  
  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return apiClient.put<T>(url, data, config);
  },
  
  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return apiClient.delete<T>(url, config);
  },
};

export default api; 
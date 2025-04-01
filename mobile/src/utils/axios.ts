import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api';

// 开启详细日志输出用于调试
const enableDebugLogs = true;

// 创建axios实例
const instance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 超时时间30秒
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
instance.interceptors.request.use(
  async (config) => {
    if (enableDebugLogs) {
      const method = config.method?.toUpperCase() || 'UNKNOWN';
      const baseUrl = config.baseURL || '';
      const url = config.url || '';
      
      console.log(`🚀 发送${method}请求: ${baseUrl}${url}`);
      if (config.data) {
        console.log('📦 请求数据:', JSON.stringify(config.data).substring(0, 500));
      }
      if (config.params) {
        console.log('🔍 请求参数:', config.params);
      }
    }
    
    // 从本地存储获取token
    const token = await AsyncStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    console.error('❌ 请求发送失败:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
instance.interceptors.response.use(
  (response) => {
    if (enableDebugLogs) {
      const method = response.config.method?.toUpperCase() || 'UNKNOWN';
      const url = response.config.url || 'unknown';
      console.log(`✅ ${method}请求成功: ${url}`);
      console.log(`📊 状态码: ${response.status}`);
      console.log('📦 响应数据:', JSON.stringify(response.data).substring(0, 500));
    }
    return response;
  },
  async (error) => {
    if (enableDebugLogs) {
      console.error('❌ 请求失败:', error.message);
      
      if (error.response) {
        // 服务器返回了错误状态码
        const method = error.config?.method?.toUpperCase() || 'UNKNOWN';
        const url = error.config?.url || 'unknown';
        console.error(`🔥 ${method}请求错误: ${url}`);
        console.error(`📊 状态码: ${error.response.status}`);
        
        try {
          console.error('📦 错误响应:', JSON.stringify(error.response.data).substring(0, 500));
        } catch (e) {
          console.error('📦 错误响应(非JSON):', String(error.response.data).substring(0, 500));
        }
        
        // 处理401未授权错误
        if (error.response.status === 401) {
          await AsyncStorage.removeItem('auth_token');
          console.warn('⚠️ 用户未授权，已清除token');
        }
      } else if (error.request) {
        // 请求已发送但没有收到响应
        console.error('⏱️ 请求超时或无响应:', error.config?.url || 'unknown');
      } else {
        // 设置请求时发生错误
        console.error('🔧 请求配置错误:', error.message);
      }
    }
    
    return Promise.reject(error);
  }
);

export default instance; 
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";

// 从环境变量获取基本URL
const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

// 创建axios实例
const httpClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// 请求拦截器
httpClient.interceptors.request.use(
  (config) => {
    // 从localStorage获取token
    const token = localStorage.getItem("auth_token");

    // 如果存在token，添加到请求头
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
httpClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // 处理401错误(未授权)
    if (error.response && error.response.status === 401) {
      // 清除token并重定向到登录页
      localStorage.removeItem("auth_token");
      window.location.href = "/login";
    }

    // 处理其他错误
    return Promise.reject(error);
  }
);

// 封装GET请求
export const get = <T>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> => {
  return httpClient
    .get(url, config)
    .then((response: AxiosResponse<T>) => response.data);
};

// 封装POST请求
export const post = <T>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<T> => {
  return httpClient
    .post(url, data, config)
    .then((response: AxiosResponse<T>) => response.data);
};

// 封装PUT请求
export const put = <T>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<T> => {
  return httpClient
    .put(url, data, config)
    .then((response: AxiosResponse<T>) => response.data);
};

// 封装DELETE请求
export const del = <T>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> => {
  return httpClient
    .delete(url, config)
    .then((response: AxiosResponse<T>) => response.data);
};

export default httpClient;

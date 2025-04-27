/**
 * 认证相关类型定义
 */

export interface User {
  id: number;
  username: string;
  email?: string;
  role?: string;
  created_at?: string;
  updated_at?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  email?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
  token?: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<{ success: boolean; message: string }>;
  register: (
    data: RegisterRequest
  ) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
}

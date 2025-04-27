/**
 * 监控相关类型定义
 */

export interface Monitor {
  id: number;
  name: string;
  url: string;
  method: string;
  headers?: string;
  body?: string;
  expected_status?: number;
  interval: number;
  timeout: number;
  status: "up" | "down" | "pending" | "unknown";
  last_checked?: string;
  uptime_percentage?: number;
  uptime?: number;
  response_time?: number;
  user_id: number;
  created_by?: number;
  active?: number;
  created_at: string;
  updated_at: string;
  history?: MonitorStatusHistory[];
}

export interface MonitorStatusHistory {
  id: number;
  monitor_id: number;
  status: "up" | "down";
  response_time?: number;
  timestamp?: string;
  status_code?: number;
  error?: string;
}

export interface MonitorStatusHistoryResponse {
  success: boolean;
  message: string;
  history?: MonitorStatusHistory[];
}

export interface MonitorResponse {
  success: boolean;
  message: string;
  monitor?: Monitor;
}

export interface MonitorsResponse {
  success: boolean;
  message: string;
  monitors?: Monitor[];
}

export interface HistoryResponse {
  success: boolean;
  message: string;
  history?: MonitorStatusHistory[];
}

export interface CreateMonitorRequest {
  name: string;
  url: string;
  method: string;
  headers?: Record<string, string>;
  body?: string;
  expected_status?: number;
  interval: number;
  timeout: number;
}

export interface UpdateMonitorRequest {
  name?: string;
  url?: string;
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  expected_status?: number;
  interval?: number;
  timeout?: number;
}

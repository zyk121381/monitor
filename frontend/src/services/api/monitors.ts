import api from "./index";
import {
  MonitorResponse,
  MonitorsResponse,
  CreateMonitorRequest,
  UpdateMonitorRequest,
  HistoryResponse,
  MonitorStatusHistoryResponse,
} from "../../types/monitors";

// 获取所有监控
export const getAllMonitors = async (): Promise<MonitorsResponse> => {
  const response = await api.get<MonitorsResponse>("/api/monitors");
  return response.data;
};

// 获取单个监控
export const getMonitor = async (id: number): Promise<MonitorResponse> => {
  const response = await api.get<MonitorResponse>(`/api/monitors/${id}`);
  return response.data;
};

// 创建监控
export const createMonitor = async (
  data: CreateMonitorRequest
): Promise<MonitorResponse> => {
  const response = await api.post<MonitorResponse>("/api/monitors", data);
  return response.data;
};

// 更新监控
export const updateMonitor = async (
  id: number,
  data: UpdateMonitorRequest
): Promise<MonitorResponse> => {
  const response = await api.put<MonitorResponse>(`/api/monitors/${id}`, data);
  return response.data;
};

// 删除监控
export const deleteMonitor = async (id: number): Promise<MonitorResponse> => {
  const response = await api.delete<MonitorResponse>(`/api/monitors/${id}`);
  return response.data;
};

// 获取监控历史
export const getMonitorHistory = async (
  id: number
): Promise<HistoryResponse> => {
  const response = await api.get<HistoryResponse>(
    `/api/monitors/${id}/history`
  );
  return response.data;
};

// 手动检查监控
export const checkMonitor = async (
  id: number
): Promise<MonitorStatusHistoryResponse> => {
  const response = await api.post<MonitorStatusHistoryResponse>(
    `/api/monitors/${id}/check`
  );
  return response.data;
};

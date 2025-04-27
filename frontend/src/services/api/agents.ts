import api from "./index";
import { Agent, AgentResponse, AgentsResponse } from "../../types/agents";

export const generateToken = async (): Promise<{
  success: boolean;
  token?: string;
  message?: string;
}> => {
  try {
    const response = await api.post("/api/agents/token/generate");
    return response.data;
  } catch (error) {
    console.error("生成客户端注册令牌失败:", error);
    return {
      success: false,
      message: "生成客户端注册令牌失败",
    };
  }
};

export const getAllAgents = async (): Promise<AgentsResponse> => {
    const response = await api.get("/api/agents");
    return {
      success: true,
      agents: response.data.agents,
    }

};

export const updateAgentStatus = async (
  id: number,
  metrics: {
    cpu_usage: number;
    memory_total: number;
    memory_used: number;
    disk_total: number;
    disk_used: number;
    network_rx: number;
    network_tx: number;
  }
): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await api.post(`/api/agents/${id}/status`, metrics);
    return response.data;
  } catch (error) {
    console.error("更新客户端状态失败:", error);
    return {
      success: false,
      message: "更新客户端状态失败",
    };
  }
};

export const getAgent = async (id: number): Promise<AgentResponse> => {
  const response = await api.get(`/api/agents/${id}`);
    return {
      success: true,
      agent: response.data.agent
    }
};

export const deleteAgent = async (
  id: number
): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await api.delete(`/api/agents/${id}`);
    return response.data;
  } catch (error) {
    console.error(`删除客户端 ${id} 失败:`, error);
    return {
      success: false,
      message: "删除客户端失败",
    };
  }
};

export const updateAgent = async (
  id: number,
  data: Partial<Agent>
): Promise<AgentResponse> => {
  try {
    const response = await api.put(`/api/agents/${id}`, data);
    return response.data;
  } catch (error) {
    console.error(`更新客户端 ${id} 失败:`, error);
    return {
      success: false,
    };
  }
};

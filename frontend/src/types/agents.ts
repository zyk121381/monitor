/**
 * 客户端相关类型定义
 */

export interface Agent {
  id: number;
  name: string;
  hostname?: string;
  ip_addresses?: string;
  status: "active" | "inactive" | "connecting" | "unknown";
  version?: string;
  os?: string;
  cpu_usage?: number;
  memory_total?: number;
  memory_used?: number;
  disk_total?: number;
  disk_used?: number;
  network_rx?: number;
  network_tx?: number;
  created_at: string;
  updated_at: string;
}

export interface AgentWithResources extends Agent {
  uptime: number;
  cpuUsage?: number;
  memoryUsage?: number;
  diskUsage?: number;
  networkRx?: number;
  networkTx?: number;
}

export interface ClientWithStatus extends Agent {
  status_color?: string;
  status_text?: string;
}

export interface AgentResponse {
  success: boolean;
  message: string;
  agent?: Agent;
}

export interface AgentsResponse {
  success: boolean;
  message: string;
  agents?: Agent[];
}

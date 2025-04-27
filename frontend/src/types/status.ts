/**
 * 状态页面相关类型定义
 */

import { Agent } from "./agents";
import { Monitor } from "./monitors";

export interface ConfigMonitor {
  id: number;
  name: string;
  selected: boolean;
}

export interface ConfigAgent {
  id: number;
  name: string;
  selected: boolean;
}

export interface StatusPageConfigResponse {
  title?: string;
  description?: string;
  logoUrl?: string;
  customCss?: string;
  monitors?: ConfigMonitor[];
  agents?: ConfigAgent[];
}

export interface StatusPageConfig {
  title: string;
  description: string;
  logoUrl: string;
  customCss: string;
  monitors: number[];
  agents: number[];
}

export interface StatusConfigWithDetails {
  title: string;
  description: string;
  logoUrl: string;
  customCss: string;
  publicUrl: string;
  monitors: MonitorWithSelection[];
  agents: AgentWithSelection[];
}

export interface StatusAgent
  extends Omit<
    Agent,
    "cpu_usage" | "memory_total" | "memory_used" | "disk_total" | "disk_used"
  > {
  status: "active" | "inactive";
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
}

export interface StatusPageData {
  title: string;
  description: string;
  logoUrl: string;
  customCss: string;
  monitors: Monitor[];
  agents: StatusAgent[];
}

export interface AgentWithSelection extends Agent {
  selected: boolean;
}

export interface MonitorWithSelection extends Monitor {
  selected: boolean;
}

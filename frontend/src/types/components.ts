/**
 * 组件相关类型定义
 */

import { ButtonHTMLAttributes } from "react";
import { NotificationChannel } from "./notification";
import { Monitor } from "./monitors";

// Button 组件类型
export type ButtonVariant =
  | "primary"
  | "secondary"
  | "danger"
  | "success"
  | "warning"
  | "info";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

// ChannelSelector 组件类型
export interface ChannelSelectorProps {
  channels: NotificationChannel[];
  selectedChannelIds: string[];
  onChange: (channelIds: string[]) => void;
}

// StatusSummaryCard 组件类型
export interface StatusItem {
  id: string;
  name: string;
  status: "up" | "down" | "pending" | "unknown" | "active" | "inactive";
  time?: string;
}

export interface StatusSummaryCardProps {
  title: string;
  items: StatusItem[];
  type: "monitors" | "agents";
}

// MonitorCard 组件类型
export interface MonitorCardProps {
  monitor: Monitor;
}

// ResourceBar 组件类型
export interface ResourceBarProps {
  label: string;
  value: number;
  unit?: string;
  colorThresholds?: {
    warning: number;
    danger: number;
  };
}

// StatusCodeSelect 组件类型
export interface StatusCodeSelectProps {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
}

// ClientResourceSection 组件类型
export interface ClientResourceSectionProps {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkRx: number;
  networkTx: number;
  showDetailedInfo?: boolean;
}

// AgentCard 组件类型
export interface AgentCardProps {
  agent: any; // 接受任何符合基本Agent形状的对象，包括Agent和StatusAgent
  showIpAddress?: boolean; // 是否显示IP地址
  showHostname?: boolean; // 是否显示主机名
  showLastUpdated?: boolean; // 是否显示最后更新时间
  showDetailedResources?: boolean; // 是否显示详细资源信息
  onView?: (id: number) => void;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
}

// Layout 组件类型
export interface LayoutProps {
  children: React.ReactNode;
}

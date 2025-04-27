import { Box, Card, Flex, Text, Badge } from "@radix-ui/themes";
import { GlobeIcon } from "@radix-ui/react-icons";
import ClientResourceSection from "./ClientResourceSection";
import "../styles/components.css";
import { useTranslation } from "react-i18next";
import { AgentCardProps } from "../types/components";

/**
 * 客户端状态卡片组件
 * 用于显示单个客户端的状态和资源使用情况
 */
const AgentCard = ({
  agent,
  showIpAddress = true,
  showHostname = true,
  showLastUpdated = true,
  showDetailedResources = true,
}: AgentCardProps) => {
  const { t } = useTranslation();

  // 解析获取资源使用情况
  let cpuUsage = 0;
  let memoryUsage = 0;
  let diskUsage = 0;
  let networkRx = 0;
  let networkTx = 0;

  console.log(t("agentCard.receivedData"), agent);

  try {
    // 优先从cpuUsage等属性获取，这些可能来自StatusAgent类型
    if (agent.cpuUsage !== undefined) {
      cpuUsage = agent.cpuUsage;
    } else if (agent.cpu_usage !== undefined) {
      cpuUsage = Math.round(agent.cpu_usage);
    }

    if (agent.memoryUsage !== undefined) {
      memoryUsage = agent.memoryUsage;
    } else if (agent.memory_total && agent.memory_used) {
      memoryUsage = Math.round((agent.memory_used / agent.memory_total) * 100);
    }

    if (agent.diskUsage !== undefined) {
      diskUsage = agent.diskUsage;
    } else if (agent.disk_total && agent.disk_used) {
      diskUsage = Math.round((agent.disk_used / agent.disk_total) * 100);
    }

    // 传递原始网络流量数据 (KB/s)，ClientResourceSection 组件负责单位自适应显示
    networkRx = agent.network_rx || 0;
    networkTx = agent.network_tx || 0;

    console.log(t("agentCard.calculatedResource"), {
      cpuUsage,
      memoryUsage,
      diskUsage,
      networkRx,
      networkTx,
    });
  } catch (e) {
    console.error(t("agentCard.resourceError"), e);
  }

  // 根据status属性判断状态
  const agentStatus = agent.status || "inactive";

  // 状态颜色映射
  const statusColors: { [key: string]: string } = {
    active: "green",
    inactive: "amber",
    connecting: "yellow",
  };

  // 状态文本映射
  const statusText: { [key: string]: string } = {
    active: t("agentCard.status.active"),
    inactive: t("agentCard.status.inactive"),
    connecting: t("agentCard.status.connecting"),
  };

  // 获取IP地址显示的文本
  const getIpAddressText = () => {
    if (!agent.ip_addresses) return t("common.notFound");

    try {
      const ipArray = JSON.parse(String(agent.ip_addresses));
      return Array.isArray(ipArray) && ipArray.length > 0
        ? ipArray[0] + (ipArray.length > 1 ? ` (+${ipArray.length - 1})` : "")
        : String(agent.ip_addresses);
    } catch (e) {
      return String(agent.ip_addresses);
    }
  };

  // 格式化最后更新时间
  const formatLastUpdated = () => {
    if (!agent.updated_at) return "";

    try {
      return new Date(agent.updated_at).toLocaleString();
    } catch (e) {
      return agent.updated_at;
    }
  };

  return (
    <Card className="agent-card">
      <Flex justify="between" align="center" p="4">
        <Flex direction="column" gap="1">
          <Flex align="center" gap="2">
            <Box
              style={{
                color:
                  agentStatus === "active" ? "var(--green-9)" : "var(--gray-9)",
              }}
            >
              <GlobeIcon width="16" height="16" />
            </Box>
            <Text weight="medium">{agent.name}</Text>
          </Flex>

          {showHostname && agent.hostname && (
            <Text size="1" color="gray">
              {agent.hostname}
            </Text>
          )}

          {showIpAddress && agent.ip_addresses && (
            <Text size="1" color="gray">
              {getIpAddressText()}
            </Text>
          )}
        </Flex>
        <Badge color={statusColors[agentStatus] as any}>
          {statusText[agentStatus] || agentStatus}
        </Badge>
      </Flex>

      <Box p="4" pt="0">
        <ClientResourceSection
          cpuUsage={cpuUsage}
          memoryUsage={memoryUsage}
          diskUsage={diskUsage}
          networkRx={networkRx}
          networkTx={networkTx}
          showDetailedInfo={showDetailedResources}
        />

        {showLastUpdated && agent.updated_at && (
          <Text size="1" color="gray" mt="2">
            {t("agent.lastUpdated")}: {formatLastUpdated()}
          </Text>
        )}
      </Box>
    </Card>
  );
};

export default AgentCard;

import { Box, Flex, Text } from "@radix-ui/themes";
import ResourceBar from "./ResourceBar";
import "../styles/components.css";
import { useTranslation } from "react-i18next";
import { ClientResourceSectionProps } from "../types/components";

/**
 * 网络流量单位自适应函数
 * @param value KB/s 的值
 * @returns 格式化后的字符串和用于进度条的百分比值
 */
const formatNetworkSpeed = (
  value: number
): { text: string; percent: number } => {
  // 当值小于 1024 KB/s 时，显示 KB/s
  if (value < 1024) {
    return {
      text: `${value.toFixed(2)} KB/s`,
      percent: Math.min(value / 51.2, 100), // 5MB/s 是进度条的满值
    };
  }
  // 当值大于等于 1024 KB/s 时，显示 MB/s
  else {
    const valueMB = value / 1024;
    return {
      text: `${valueMB.toFixed(2)} MB/s`,
      percent: Math.min(value / 51.2, 100), // 5MB/s 是进度条的满值
    };
  }
};

/**
 * 客户端资源使用情况展示组件
 * 用于显示CPU、内存、磁盘和网络流量等资源使用情况
 */
const ClientResourceSection = ({
  cpuUsage = 0,
  memoryUsage = 0,
  diskUsage = 0,
  networkRx = 0,
  networkTx = 0,
  showDetailedInfo = true,
}: ClientResourceSectionProps) => {
  const { t } = useTranslation();

  // 格式化网络流量显示
  const rxFormatted = formatNetworkSpeed(networkRx);
  const txFormatted = formatNetworkSpeed(networkTx);

  return (
    <Box className="client-resource-section">
      <Flex direction="column" gap="3">
        {/* CPU使用率 */}
        <Box className="resource-item">
          <Flex justify="between" align="center" mb="1">
            <Flex align="center" gap="2">
              <Box className="resource-indicator resource-indicator-cpu" />
              <Text size="2" className="resource-label">
                {t("clientResource.cpu")}
              </Text>
            </Flex>
            <Text size="2" weight="medium">
              {cpuUsage.toFixed(1)}%
            </Text>
          </Flex>
          <ResourceBar value={cpuUsage} color="green" height={6} />
        </Box>

        {/* 内存使用率 */}
        <Box className="resource-item">
          <Flex justify="between" align="center" mb="1">
            <Flex align="center" gap="2">
              <Box className="resource-indicator resource-indicator-memory" />
              <Text size="2" className="resource-label">
                {t("clientResource.memory")}
              </Text>
            </Flex>
            <Text size="2" weight="medium">
              {memoryUsage.toFixed(1)}%
            </Text>
          </Flex>
          <ResourceBar value={memoryUsage} color="blue" height={6} />
        </Box>

        {/* 磁盘使用率 */}
        <Box className="resource-item">
          <Flex justify="between" align="center" mb="1">
            <Flex align="center" gap="2">
              <Box className="resource-indicator resource-indicator-disk" />
              <Text size="2" className="resource-label">
                {t("clientResource.disk")}
              </Text>
            </Flex>
            <Text size="2" weight="medium">
              {diskUsage.toFixed(1)}%
            </Text>
          </Flex>
          <ResourceBar value={diskUsage} color="amber" height={6} />
        </Box>

        {/* 网络流量 - 仅在显示详细信息时展示 */}
        {showDetailedInfo && (
          <Box className="resource-item">
            <Flex justify="between" align="center" mb="1">
              <Text size="2" className="resource-label">
                {t("clientResource.network")}
              </Text>
            </Flex>
            <Flex gap="3" className="network-metrics">
              {/* 下载速率 */}
              <Box className="network-segment">
                <Flex justify="between" align="center" mb="1">
                  <Flex align="center" gap="2">
                    <Box className="resource-indicator resource-indicator-download" />
                    <Text size="2" className="resource-label">
                      {t("clientResource.download")}
                    </Text>
                  </Flex>
                  <Text size="2" weight="medium">
                    {rxFormatted.text}
                  </Text>
                </Flex>
                <ResourceBar
                  value={rxFormatted.percent}
                  color="cyan"
                  height={6}
                />
              </Box>

              {/* 上传速率 */}
              <Box className="network-segment">
                <Flex justify="between" align="center" mb="1">
                  <Flex align="center" gap="2">
                    <Box className="resource-indicator resource-indicator-upload" />
                    <Text size="2" className="resource-label">
                      {t("clientResource.upload")}
                    </Text>
                  </Flex>
                  <Text size="2" weight="medium">
                    {txFormatted.text}
                  </Text>
                </Flex>
                <ResourceBar
                  value={txFormatted.percent}
                  color="indigo"
                  height={6}
                />
              </Box>
            </Flex>
          </Box>
        )}
      </Flex>
    </Box>
  );
};

export default ClientResourceSection;

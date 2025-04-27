import { Box, Flex, Text } from "@radix-ui/themes";
import { MonitorStatusHistory } from "../types/monitors";
import { useTranslation } from "react-i18next";

// 心跳网格组件 - 类似uptime-kuma的点阵网格
const HeartbeatGrid = ({
  uptime,
  history = [],
}: {
  uptime: number;
  history?: (MonitorStatusHistory | string)[];
}) => {
  const { t } = useTranslation();

  // 确保uptime值在0-100范围内
  const normalizedUptime = Math.min(Math.max(uptime, 0), 100);

  // 根据状态确定颜色
  const getColor = (itemStatus: string) => {
    switch (itemStatus) {
      case "up":
        return "var(--green-5)";
      case "down":
        return "var(--red-5)";
      case "unknown":
        return "var(--gray-5)";
      default:
        return "var(--gray-5)";
    }
  };

  // 根据状态确定悬停颜色
  const getHoverColor = (itemStatus: string) => {
    switch (itemStatus) {
      case "up":
        return "var(--green-6)";
      case "down":
        return "var(--red-6)";
      case "unknown":
        return "var(--gray-6)";
      default:
        return "var(--gray-6)";
    }
  };

  // 转换timestamp为更易读的格式
  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch (e) {
      return timestamp;
    }
  };

  // 准备显示数据
  let displayHistory: { status: string; timestamp?: string }[] = [];

  // 处理不同类型的历史数据
  if (Array.isArray(history)) {
    displayHistory = history.map((item) => {
      if (typeof item === "string") {
        return { status: item };
      }
      return item;
    });
  }

  // 限制只显示最近的24个点
  if (displayHistory.length > 24) {
    displayHistory = displayHistory.slice(0, 24);
  }

  // 如果记录不足，填充空白点
  const emptyBoxes: any[] = [];
  if (displayHistory.length < 24) {
    // 至少显示24个点，不足的用空白点补充
    for (let i = 0; i < 24 - displayHistory.length; i++) {
      emptyBoxes.push({ status: "empty" });
    }
  }

  // 每个点的大小
  const pointSize = 12;

  return (
    <Box>
      {/* 单行网格点 */}
      <Flex gap="2">
        {displayHistory.map((item, index) => (
          <Box
            key={index}
            style={{
              width: `${pointSize}px`,
              height: `${pointSize}px`,
              backgroundColor: getColor(item.status),
              borderRadius: "50%",
              transition: "all 0.2s ease-in-out",
              cursor: "pointer",
            }}
            title={`${
              item.timestamp
                ? formatTimestamp(item.timestamp)
                : t("heartbeatGrid.unknownTime")
            }: ${
              item.status === "up"
                ? t("heartbeatGrid.up")
                : t("heartbeatGrid.down")
            }`}
            onMouseEnter={(e) => {
              const target = e.currentTarget;
              target.style.backgroundColor = getHoverColor(item.status);
              target.style.transform = "scale(1.2)";
              target.style.boxShadow = "0 0 4px rgba(0, 0, 0, 0.2)";
            }}
            onMouseLeave={(e) => {
              const target = e.currentTarget;
              target.style.backgroundColor = getColor(item.status);
              target.style.transform = "scale(1)";
              target.style.boxShadow = "none";
            }}
          />
        ))}

        {/* 补充空白点 */}
        {emptyBoxes.map((_, index) => (
          <Box
            key={`empty-${index}`}
            style={{
              width: `${pointSize}px`,
              height: `${pointSize}px`,
              backgroundColor: "var(--gray-3)",
              borderRadius: "50%",
            }}
          />
        ))}
      </Flex>

      <Flex justify="between" mt="3">
        <Text size="1" style={{ color: "var(--gray-9)" }}>
          {t("heartbeatGrid.uptime")}: {normalizedUptime.toFixed(2)}%
        </Text>
        <Flex gap="2" align="center">
          <Box
            style={{
              width: "8px",
              height: "8px",
              backgroundColor: "var(--green-5)",
              borderRadius: "50%",
            }}
          />
          <Text size="1" style={{ color: "var(--gray-9)" }}>
            {t("heartbeatGrid.up")}
          </Text>
          <Box
            style={{
              width: "8px",
              height: "8px",
              backgroundColor: "var(--red-5)",
              borderRadius: "50%",
              marginLeft: "8px",
            }}
          />
          <Text size="1" style={{ color: "var(--gray-9)" }}>
            {t("heartbeatGrid.down")}
          </Text>
        </Flex>
      </Flex>
    </Box>
  );
};

export default HeartbeatGrid;

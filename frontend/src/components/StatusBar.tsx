import React, { useState, useMemo } from "react";
import {
  Box,
  Flex,
  Tooltip,
  Dialog,
  ScrollArea,
  Text,
  Button,
} from "@radix-ui/themes";
import { useTranslation } from "react-i18next";
import { MonitorStatusHistory } from "../types/monitors";

interface StatusBarProps {
  status: string;
  history?: MonitorStatusHistory[];
}

/**
 * 状态条组件 - 展示监控状态历史的时间轴格子
 * 每个格子代表一天的数据，最多展示最近90天
 */
const StatusBar: React.FC<StatusBarProps> = ({ status, history = [] }) => {
  const { t } = useTranslation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState("");
  const [dialogContent, setDialogContent] = useState<React.ReactNode>(<div />);

  // 根据状态或百分比确定颜色
  const getColor = (value: string | number, isHover = false) => {
    // 如果值是百分比字符串，转换为数字
    const numValue =
      typeof value === "string"
        ? parseFloat(value)
        : typeof value === "number"
        ? value
        : 0;

    // 根据状态或百分比确定颜色
    if (typeof value === "string") {
      switch (value) {
        case "up":
          return isHover ? "var(--green-6)" : "var(--green-5)";
        case "down":
          return isHover ? "var(--red-6)" : "var(--red-5)";
        default:
          return isHover ? "var(--gray-6)" : "var(--gray-5)";
      }
    } else {
      // 根据百分比确定颜色
      if (numValue >= 99) {
        return isHover ? "var(--green-6)" : "var(--green-5)";
      } else if (numValue >= 95) {
        return isHover ? "var(--yellow-6)" : "var(--yellow-5)";
      } else if (numValue >= 90) {
        return isHover ? "var(--orange-6)" : "var(--orange-5)";
      } else {
        return isHover ? "var(--red-6)" : "var(--red-5)";
      }
    }
  };

  // 按天聚合数据
  const dailyHistory = useMemo(() => {
    // 确保历史记录有数据
    if (history.length === 0) {
      return [
        {
          date: new Date().toISOString().split("T")[0],
          status: status as "up" | "down",
          availability: 100,
          records: [
            {
              id: 0,
              monitor_id: 0,
              status: status as "up" | "down",
              response_time: 0,
              timestamp: new Date().toISOString(),
            },
          ],
        },
      ];
    }

    // 按日期分组
    const grouped: Record<string, MonitorStatusHistory[]> = {};

    // 确保每条记录都有时间戳
    history.forEach((item) => {
      if (!item.timestamp) return;

      // 提取日期部分 (YYYY-MM-DD)
      const dateStr = new Date(item.timestamp).toISOString().split("T")[0];

      if (!grouped[dateStr]) {
        grouped[dateStr] = [];
      }

      grouped[dateStr].push(item);
    });

    // 转换为按日期排序的数组
    const result = Object.entries(grouped)
      .map(([date, records]) => {
        // 按时间戳排序，确保最新的在前面
        const sortedRecords = [...records].sort((a, b) => {
          const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
          const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
          return timeB - timeA; // 降序，最新的在前
        });

        // 计算当天的主要状态
        const downCount = records.filter((r) => r.status === "down").length;
        const upCount = records.filter((r) => r.status === "up").length;
        const primaryStatus = upCount > downCount ? "up" : "down";

        // 计算可用率
        const availability =
          records.length > 0 ? (upCount / records.length) * 100 : 0;

        return {
          date,
          status: primaryStatus,
          availability,
          records: sortedRecords,
        };
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // 最多返回最近90天
    const maxDays = 90;
    return result.slice(-maxDays);
  }, [history, status]);

  // 显示详细信息对话框
  const showDialog = (dayData: {
    date: string;
    status: string;
    records: MonitorStatusHistory[];
    availability: number;
  }) => {
    const date = new Date(dayData.date).toLocaleDateString();
    const statusText =
      dayData.status === "up"
        ? t("monitor.status.normal")
        : t("monitor.status.failure");

    setDialogTitle(`📅 ${date} - ${statusText}`);

    // 获取该天最新的10条记录
    const latestRecords = dayData.records.slice(0, 10);

    setDialogContent(
      <Box p="4">
        <p>
          {t("common.date")}: {date}
        </p>
        <p>
          {t("common.status")}: {statusText}
        </p>
        <p>
          {t("monitor.history.records")}: {dayData.records.length}
        </p>
        <p>
          {t("monitor.history.availability")}: {dayData.availability.toFixed(2)}
          %
        </p>

        <Box mt="4">
          <p>{t("monitor.history.latest")}:</p>
          <ScrollArea style={{ height: "200px", marginTop: "10px" }}>
            {latestRecords.map((record, idx) => {
              const recordTime = record.timestamp
                ? new Date(record.timestamp).toLocaleString()
                : "";

              return (
                <Box
                  key={record.id || `record-${idx}`}
                  style={{
                    padding: "8px",
                    marginBottom: "8px",
                    borderRadius: "4px",
                    backgroundColor:
                      record.status === "up"
                        ? "var(--green-2)"
                        : "var(--red-2)",
                  }}
                >
                  <p>
                    {t("common.status")}:{" "}
                    {record.status === "up"
                      ? t("monitor.status.normal")
                      : t("monitor.status.failure")}
                  </p>
                  <p>
                    {t("monitor.history.time")}: {recordTime}
                  </p>
                  <p>
                    {t("monitor.history.responseTime")}: {record.response_time}
                    ms
                  </p>
                  {record.error && (
                    <p>
                      {t("monitor.history.error")}: {record.error}
                    </p>
                  )}
                </Box>
              );
            })}
          </ScrollArea>
        </Box>
      </Box>
    );

    setDialogOpen(true);
  };

  return (
    <>
      {/* 状态历史条 - 使用Grid布局代替Flex */}
      <Box 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: `repeat(${dailyHistory.length}, 1fr)`,
          gap: '4px', 
          width: '100%' 
        }}
      >
        {dailyHistory.map((dayData, index) => {
          return (
            <Tooltip
              key={dayData.date || `empty-${index}`}
              content={
                <>
                  <Text as="span" size="1" mb="1">
                    {t("common.date")}:{" "}
                    {new Date(dayData.date).toLocaleDateString()}
                  </Text>
                  <br></br>
                  <Text as="span" size="1" mb="1">
                    {t("common.status")}:{" "}
                    {dayData.status === "up"
                      ? t("monitor.status.normal")
                      : dayData.status === "down"
                      ? t("monitor.status.failure")
                      : t("monitor.status.pending")}
                  </Text>
                  <br></br>
                  <Text as="span" size="1" mb="1">
                    {t("monitor.history.records")}: {dayData.records.length}
                  </Text>
                  <br></br>
                  <Text as="span" size="1" mb="1">
                    {t("monitor.history.availability")}:{" "}
                    {dayData.availability.toFixed(2)}%
                  </Text>
                </>
              }
            >
              <Button
                style={{
                  width: '100%',
                  height: "50px",
                  backgroundColor: getColor(dayData.status),
                  borderRadius: "2px",
                  transition: "background-color 0.2s",
                  cursor: "pointer",
                  padding: '0'
                }}
                onClick={() => showDialog(dayData)}
              />
            </Tooltip>
          );
        })}
      </Box>

      {/* 详细信息对话框 */}
      <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
        <Dialog.Content style={{ maxWidth: "500px" }}>
          <Dialog.Title>{dialogTitle}</Dialog.Title>
          <Dialog.Description>{dialogContent}</Dialog.Description>
          <Flex gap="3" mt="2" justify="end">
            <Dialog.Close>
              <button style={{ cursor: "pointer", padding: "6px 12px" }}>
                {t("common.close")}
              </button>
            </Dialog.Close>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </>
  );
};

export default StatusBar;

import React, { useMemo } from "react";
import { Box, Tooltip, Text } from "@radix-ui/themes";
import { useTranslation } from "react-i18next";
import { DailyStats } from "../types/monitors";

interface StatusBarProps {
  dailyStats?: DailyStats[]; // 新增每日统计数据参数
}

/**
 * 状态条组件 - 展示监控状态历史的时间轴格子
 * 每个格子代表一天的数据，最多展示最近30天
 */
const StatusBar: React.FC<StatusBarProps> = ({ dailyStats = [] }) => {
  const { t } = useTranslation();

  console.log("StatusBar组件的dailyStats: ", dailyStats);

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

  // 按天聚合数据 - 优先使用每日统计数据，如果没有则使用历史记录
  const dailyHistory = useMemo(() => {
    // 如果有每日统计数据，优先使用
    if (dailyStats && dailyStats.length > 0) {
      return dailyStats.map((stat) => {
        // 确定每天的主要状态
        const dailyStatus =
          stat.up_checks > stat.down_checks
            ? ("up" as const)
            : ("down" as const);

        return {
          date: stat.date,
          status: dailyStatus,
          availability: stat.availability,
          total_checks: stat.total_checks,
          up_checks: stat.up_checks,
          down_checks: stat.down_checks,
          avg_response_time: stat.avg_response_time,
          min_response_time: stat.min_response_time,
          max_response_time: stat.max_response_time,
          monitor_id: stat.monitor_id,
        };
      });
    }
  }, [dailyStats]);

  return (
    <>
      {/* 状态历史条 - 使用Grid布局代替Flex */}
      <Box
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${dailyHistory?.length}, 1fr)`,
          gap: "4px",
          width: "100%",
        }}
      >
        {dailyHistory?.map((dayData) => {
          return (
            <Tooltip
              key={`${dayData.monitor_id}-${Math.random()}`}
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
                    {t("monitor.history.availability")}:{" "}
                    {dayData.availability.toFixed(2)}%
                  </Text>
                </>
              }
            >
              <Box
                style={{
                  width: "100%",
                  height: "50px",
                  backgroundColor: getColor(dayData.status),
                  borderRadius: "2px",
                  transition: "background-color 0.2s",
                  cursor: "pointer",
                  padding: "0",
                }}
              />
            </Tooltip>
          );
        })}
      </Box>
    </>
  );
};

export default StatusBar;

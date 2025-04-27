import { Box } from "@radix-ui/themes";
import "../styles/components.css";

/**
 * 资源使用量进度条组件
 * 用于展示CPU、内存、磁盘等资源的使用百分比
 */
interface ResourceBarProps {
  /** 资源使用百分比，0-100 */
  value: number;
  /**
   * 颜色方案
   * - 'dynamic': 根据值动态变化颜色（<50%绿色，50-75%琥珀色，>75%红色）
   * - 'green'/'blue'/'amber'/'red'/'cyan'/'indigo': 固定颜色
   */
  color?: string;
  /** 进度条高度，单位px */
  height?: number;
  /** 是否启用动画效果 */
  animate?: boolean;
}

/**
 * 资源使用量可视化进度条
 *
 * @example
 * // 基本用法
 * <ResourceBar value={45} />
 *
 * // 动态颜色（随数值变化颜色）
 * <ResourceBar value={75} color="dynamic" />
 *
 * // 自定义高度和颜色
 * <ResourceBar value={30} color="blue" height={10} />
 */
const ResourceBar = ({
  value = 0,
  color = "green",
  height = 8,
  animate = true,
}: ResourceBarProps) => {
  // 确保值在0-100之间
  const safeValue = Math.min(Math.max(value, 0), 100);

  // 动态颜色映射
  const getColorClass = () => {
    if (color === "dynamic") {
      if (safeValue < 50) return "resource-bar-green";
      if (safeValue < 75) return "resource-bar-amber";
      return "resource-bar-red";
    }

    return `resource-bar-${color}`;
  };

  return (
    <Box
      className="resource-bar-container"
      style={{
        height: `${height}px`,
        borderRadius: `${height / 2}px`,
      }}
    >
      <Box
        className={`resource-bar-progress ${
          animate ? "" : "no-animation"
        } ${getColorClass()}`}
        style={{
          width: `${safeValue}%`,
          borderRadius: `${height / 2}px`,
        }}
      />
    </Box>
  );
};

export default ResourceBar;

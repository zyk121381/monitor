import { Bindings } from "../models/db";
import * as models from "../models";
import * as repositories from "../repositories";
import * as NotificationService from "./NotificationService";



/**
 * 获取所有需要检查的监控
 */
export async function getMonitorsToCheck(db: Bindings["DB"]) {
  return await repositories.getMonitorsToCheck(db);
}

/**
 * 检查单个监控的状态
 * @param db 数据库连接
 * @param monitor 监控配置
 * @returns 监控检查结果
 */
export async function checkMonitor(
  db: Bindings["DB"],
  monitor: models.Monitor
) {
  try {
    console.log(`开始检查监控项: ${monitor.name} (${monitor.url})`);

    // 记录监控之前的状态
    const previousStatus = monitor.status;

    const startTime = Date.now();
    let response;
    let error = null;

    // 使用 headers 对象
    let customHeaders = monitor.headers || {};

    try {
      // 设置超时
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        (monitor.timeout || 30) * 1000
      );

      // 发送请求
      response = await fetch(monitor.url, {
        method: monitor.method || "GET",
        headers: customHeaders,
        body:
          monitor.method !== "GET" && monitor.method !== "HEAD"
            ? monitor.body || undefined
            : undefined,
        signal: controller.signal,
      });

      // 清除超时
      clearTimeout(timeoutId);
    } catch (e) {
      // 处理请求错误
      error = e instanceof Error ? e.message : String(e);
      console.error(`监控 ${monitor.name} (${monitor.url}) 请求失败: ${error}`);

      return {
        success: false,
        status: "down",
        previous_status: previousStatus,
        error,
        responseTime: Date.now() - startTime,
        statusCode: null,
      };
    }

    // 计算响应时间
    const responseTime = Date.now() - startTime;

    // 检查状态码是否符合预期
    let isExpectedStatus = false;
    const expectedStatus = monitor.expected_status || 200;

    // 处理范围状态码：如果预期状态码为个位数（1-5），则视为范围检查
    if (expectedStatus >= 1 && expectedStatus <= 5) {
      // 例如，当预期状态码为2时，匹配所有2xx状态码
      const statusCodeFirstDigit = Math.floor(response.status / 100);
      isExpectedStatus = statusCodeFirstDigit === expectedStatus;
    } else {
      // 精确匹配状态码
      isExpectedStatus = response.status === expectedStatus;
    }

    const status = isExpectedStatus ? "up" : "down";

    // 记录状态历史
    await repositories.insertMonitorStatusHistory(
      db,
      monitor.id,
      status,
      responseTime,
      response.status,
      error
    );

    // 更新监控状态
    await repositories.updateMonitorStatus(
      db,
      monitor.id,
      status,
      responseTime
    );

    return {
      success: true,
      status,
      previous_status: previousStatus,
      responseTime,
      statusCode: response.status,
      error: isExpectedStatus
        ? null
        : `状态码不符合预期: ${
            response.status
          }, 预期: ${getExpectedStatusDisplay(expectedStatus)}`,
    };
  } catch (error) {
    console.error(`检查监控出错 (${monitor.name}):`, error);
    return {
      success: false,
      status: "error",
      previous_status: monitor.status,
      error: error instanceof Error ? error.message : String(error),
      responseTime: 0,
      statusCode: null,
    };
  }
}

/**
 * 获取所有监控（根据用户角色过滤）
 * @param db 数据库连接
 * @returns 监控列表和操作结果
 */
export async function getAllMonitors(db: Bindings["DB"]) {
  const result = await repositories.getAllMonitors(db);

  return {
    success: true,
    monitors: result.monitors || [],
    status: 200,
  };
}

/**
 * 获取单个监控详情
 * @param db 数据库连接
 * @param id 监控ID
 * @returns 监控详情和操作结果
 */
export async function getMonitorById(db: Bindings["DB"], id: number) {
  const monitor = await repositories.getMonitorById(db, id);

  if (!monitor) {
    return { success: false, message: "监控不存在", status: 404 };
  }

  // 获取历史状态数据
  const historyResult = await repositories.getMonitorStatusHistoryIn24h(db, id);

  return {
    success: true,
    monitor: {
      ...monitor,
      history: historyResult.results || [],
    },
    status: 200,
  };
}

/**
 * 创建新监控
 * @param db 数据库连接
 * @param data 监控数据
 * @param userId 用户ID
 * @returns 创建结果
 */
export async function createMonitor(
  db: Bindings["DB"],
  data: any,
  userId: number
) {
  try {
    // 验证必填字段
    if (!data.name || !data.url || !data.method) {
      return { success: false, message: "缺少必填字段", status: 400 };
    }

    // 创建新监控
    const newMonitor = await repositories.createMonitor(
      db,
      data.name,
      data.url,
      data.method,
      data.interval || 60,
      data.timeout || 30,
      data.expected_status || 200,
      data.headers || {},
      data.body || "",
      userId
    );

    return {
      success: true,
      monitor: newMonitor,
      status: 201,
    };
  } catch (error) {
    console.error("创建监控错误:", error);
    return {
      success: false,
      message: "创建监控失败",
      error: error instanceof Error ? error.message : String(error),
      status: 500,
    };
  }
}

/**
 * 更新监控信息
 * @param db 数据库连接
 * @param id 监控ID
 * @param data 更新数据
 * @returns 更新结果
 */
export async function updateMonitor(db: Bindings["DB"], id: number, data: any) {
  try {
    // 检查监控是否存在
    const monitor = await repositories.getMonitorById(db, id);

    if (!monitor) {
      return { success: false, message: "监控不存在", status: 404 };
    }

    // 准备更新数据
    const updateData: Partial<models.Monitor> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.url !== undefined) updateData.url = data.url;
    if (data.method !== undefined) updateData.method = data.method;
    if (data.interval !== undefined) updateData.interval = data.interval;
    if (data.timeout !== undefined) updateData.timeout = data.timeout;
    if (data.expected_status !== undefined)
      updateData.expected_status = data.expected_status;
    if (data.headers !== undefined) updateData.headers = data.headers;
    if (data.body !== undefined) updateData.body = data.body;
    if (data.active !== undefined) updateData.active = data.active;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.responseTime !== undefined)
      updateData.response_time = data.responseTime;
    if (data.lastChecked !== undefined)
      updateData.last_checked = data.lastChecked;

    // 执行更新
    const updatedMonitor = await repositories.updateMonitorConfig(
      db,
      id,
      updateData
    );

    if (typeof updatedMonitor === "object" && "message" in updatedMonitor) {
      return {
        success: true,
        message: updatedMonitor.message,
        monitor: monitor,
        status: 200,
      };
    }

    return {
      success: true,
      monitor: updatedMonitor,
      status: 200,
    };
  } catch (error) {
    console.error("更新监控错误:", error);
    return {
      success: false,
      message: "更新监控失败",
      error: error instanceof Error ? error.message : String(error),
      status: 500,
    };
  }
}

/**
 * 删除监控
 * @param db 数据库连接
 * @param id 监控ID
 * @returns 删除结果
 */
export async function deleteMonitor(db: Bindings["DB"], id: number) {
  try {
    // 检查监控是否存在
    const monitor = await repositories.getMonitorById(db, id);

    if (!monitor) {
      return { success: false, message: "监控不存在", status: 404 };
    }

    // 执行删除
    const result = await repositories.deleteMonitor(db, id);

    if (!result.success) {
      throw new Error("删除监控失败");
    }

    return {
      success: true,
      message: "监控已删除",
      status: 200,
    };
  } catch (error) {
    console.error("删除监控错误:", error);
    return {
      success: false,
      message: "删除监控失败",
      error: error instanceof Error ? error.message : String(error),
      status: 500,
    };
  }
}

/**
 * 获取监控状态历史
 * @param db 数据库连接
 * @param id 监控ID
 * @param userId 用户ID
 * @param userRole 用户角色
 * @returns 状态历史
 */
export async function getMonitorStatusHistoryById(
  db: Bindings["DB"],
  id: number,
  userId: number,
  userRole: string
) {
  try {
    // 检查监控是否存在
    const monitor = await repositories.getMonitorById(db, id);

    if (!monitor) {
      return { success: false, message: "监控不存在", status: 404 };
    }

    // 检查权限
    if (userRole !== "admin" && monitor.created_by !== userId) {
      return { success: false, message: "无权访问此监控历史", status: 403 };
    }

    // 获取历史状态
    const historyResult = await repositories.getMonitorStatusHistoryIn24h(
      db,
      id
    );

    return {
      success: true,
      history: historyResult.results || [],
      status: 200,
    };
  } catch (error) {
    console.error("获取监控历史错误:", error);
    return {
      success: false,
      message: "获取监控历史失败",
      error: error instanceof Error ? error.message : String(error),
      status: 500,
    };
  }
}

/**
 *
 * 获取所有监控状态历史
 * @param db 数据库连接
 * @returns 所有监控状态历史
 */
export async function getAllMonitorStatusHistory(db: Bindings["DB"]) {
  const result = await repositories.getAllMonitorStatusHistoryIn24h(db);
  return {
    success: true,
    history: result.results || [],
    status: 200,
  };
}

/**
 * 手动检查监控并处理通知
 * @param db 数据库连接
 * @param id 监控ID
 * @param env 环境变量
 * @returns 检查结果
 */
export async function manualCheckMonitor(
  db: Bindings["DB"],
  id: number,
  env: any
) {
  try {
    // 检查监控是否存在
    const monitor = await repositories.getMonitorById(db, id);

    if (!monitor) {
      return { success: false, message: "监控不存在", status: 404 };
    }

    // 使用抽象出来的通用检查监控函数进行检查
    const result = await checkMonitor(db, monitor);

    // 处理通知逻辑
    try {
      // 判断是否需要发送通知
      if (result.previous_status !== result.status) {
        console.log(
          `状态已变化: ${result.previous_status} -> ${result.status}`
        );

        // 检查是否需要发送通知
        console.log(`检查通知设置...`);
        const notificationCheck =
          await NotificationService.shouldSendNotification(
            db,
            "monitor",
            monitor.id,
            result.previous_status,
            result.status
          );

        console.log(
          `通知判断结果: shouldSend=${
            notificationCheck.shouldSend
          }, channels=${JSON.stringify(notificationCheck.channels)}`
        );

        if (
          notificationCheck.shouldSend &&
          notificationCheck.channels.length > 0
        ) {
          console.log(
            `监控 ${monitor.name} (ID: ${monitor.id}) 状态变更，正在发送通知...`
          );

          // 准备通知变量
          const variables = {
            name: monitor.name,
            status: result.status,
            previous_status: result.previous_status || "未知",
            time: new Date().toLocaleString("zh-CN"),
            response_time: `${result.responseTime}ms`,
            url: monitor.url,
            status_code: result.statusCode
              ? result.statusCode.toString()
              : "无",
            expected_status: monitor.expected_status.toString(),
            error: result.error || "无",
            details: `URL: ${monitor.url}\n响应时间: ${
              result.responseTime
            }ms\n状态码: ${result.statusCode || "无"}\n错误信息: ${
              result.error || "无"
            }`,
          };

          console.log(`通知变量: ${JSON.stringify(variables)}`);

          // 发送通知
          console.log(`开始发送通知...`);
          const notificationResult = await NotificationService.sendNotification(
            db,
            "monitor",
            monitor.id,
            variables,
            notificationCheck.channels
          );

          console.log(`通知发送结果: ${JSON.stringify(notificationResult)}`);

          if (notificationResult.success) {
            console.log(
              `监控 ${monitor.name} (ID: ${monitor.id}) 通知发送成功`
            );
          } else {
            console.error(
              `监控 ${monitor.name} (ID: ${monitor.id}) 通知发送失败`
            );
          }
        } else {
          console.log(
            `监控 ${monitor.name} (ID: ${monitor.id}) 状态变更，但不需要发送通知`
          );
        }
      } else {
        console.log(
          `监控 ${monitor.name} (ID: ${monitor.id}) 状态未变更，不发送通知`
        );
      }
    } catch (notificationError) {
      console.error("处理通知时出错:", notificationError);
      // 通知处理错误不影响主流程返回
    }

    return {
      success: true,
      message: "监控检查完成",
      result,
      status: 200,
    };
  } catch (error) {
    console.error("手动检查监控错误:", error);
    return {
      success: false,
      message: "手动检查监控失败",
      error: error instanceof Error ? error.message : String(error),
      status: 500,
    };
  }
}

/**
 * 获取预期状态码的显示文本
 * @param expectedStatus 预期状态码
 * @returns 显示文本
 */
function getExpectedStatusDisplay(expectedStatus: number): string {
  if (expectedStatus >= 1 && expectedStatus <= 5) {
    return `${expectedStatus}xx`;
  }
  return String(expectedStatus);
}

/**
 * 获取单个监控的每日统计数据
 * @param db 数据库连接
 * @param id 监控ID
 * @returns 监控的每日统计数据和操作结果
 */
export async function getMonitorDailyStats(db: Bindings["DB"], id: number) {
  const result = await repositories.getMonitorDailyStatsById(db, id);

  return {
    success: true,
    dailyStats: result.results,
    message: "获取监控每日统计数据成功",
    status: 200,
  };
}

/**
 * 获取所有监控的每日统计数据
 * @param db 数据库连接
 * @returns 所有监控的每日统计数据和操作结果
 */
export async function getAllMonitorDailyStats(db: Bindings["DB"]) {
  // 获取所有监控
  const result = await repositories.getAllMonitorDailyStats(db);
  return {
    success: true,
    dailyStats: result.results,
    message: "获取所有监控的每日统计数据成功",
    status: 200,
  };
}

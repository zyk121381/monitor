import { Bindings } from "../models/db";
import { Monitor, MonitorStatusHistory } from "../models/monitor";

// 定义操作结果的元数据类型
interface DbResultMeta {
  changes?: number;
  [key: string]: any;
}

/**
 * 监控相关的数据库操作
 */

// 清理30天以前的历史记录
export async function cleanupOldRecords(db: Bindings["DB"]) {
  try {
    console.log("开始清理90天以前的历史记录...");

    // 清理监控状态历史记录
    const deleteStatusHistoryResult = await db
      .prepare(
        `
      DELETE FROM monitor_status_history 
      WHERE timestamp < datetime('now', '-90 days')
    `
      )
      .run();

    // 清理通知历史记录
    const deleteNotificationHistoryResult = await db
      .prepare(
        `
      DELETE FROM notification_history 
      WHERE sent_at < datetime('now', '-90 days')
    `
      )
      .run();

    const statusHistoryDeleted =
      (deleteStatusHistoryResult.meta as DbResultMeta)?.changes || 0;
    const notificationHistoryDeleted =
      (deleteNotificationHistoryResult.meta as DbResultMeta)?.changes || 0;

    console.log(
      `清理完成：删除了 ${statusHistoryDeleted} 条状态历史记录，${notificationHistoryDeleted} 条通知历史记录`
    );

    return {
      success: true,
      statusHistoryDeleted,
      notificationHistoryDeleted,
    };
  } catch (error) {
    console.error("清理历史记录出错:", error);
    return { success: false, error: String(error) };
  }
}

// 获取需要检查的监控列表
export async function getMonitorsToCheck(db: Bindings["DB"]) {
  const result = await db
    .prepare(
      `
    SELECT * FROM monitors 
    WHERE active = true 
    AND (last_checked IS NULL OR datetime('now') > datetime(last_checked, '+' || interval || ' seconds'))
  `
    )
    .all<Monitor>();

  // 解析所有监控的 headers 字段
  if (result.results) {
    result.results.forEach((monitor) => {
      if (typeof monitor.headers === "string") {
        try {
          monitor.headers = JSON.parse(monitor.headers);
        } catch (e) {
          monitor.headers = {};
        }
      }
    });
  }

  return result;
}

// 获取单个监控详情
export async function getMonitorById(db: Bindings["DB"], id: number) {
  const monitor = await db
    .prepare("SELECT * FROM monitors WHERE id = ?")
    .bind(id)
    .first<Monitor>();

  // 解析 headers 字段
  if (monitor && typeof monitor.headers === "string") {
    try {
      monitor.headers = JSON.parse(monitor.headers);
    } catch (e) {
      monitor.headers = {};
    }
  }

  return monitor;
}

// 批量获取监控项详情
export async function getMonitorsByIds(
  db: Bindings["DB"],
  monitorIds: number[]
) {
  if (monitorIds.length === 0) {
    return { results: [] };
  }

  const placeholders = monitorIds.map(() => "?").join(",");
  return await db
    .prepare(`SELECT * FROM monitors WHERE id IN (${placeholders})`)
    .bind(...monitorIds)
    .all<Monitor>();
}

// 获取监控状态历史
export async function getMonitorStatusHistory(
  db: Bindings["DB"],
  monitorId: number
) {
  return await db
    .prepare(
      `SELECT * FROM monitor_status_history 
     WHERE monitor_id = ? 
     ORDER BY timestamp ASC`
    )
    .bind(monitorId)
    .all<MonitorStatusHistory>();
}

// 记录监控状态历史
export async function insertMonitorStatusHistory(
  db: Bindings["DB"],
  monitorId: number,
  status: string,
  response_time: number,
  status_code: number,
  error: string | null
) {
  // 使用ISO格式的时间戳
  const now = new Date().toISOString();

  return await db
    .prepare(
      `INSERT INTO monitor_status_history (monitor_id, status, timestamp, response_time, status_code, error) 
     VALUES (?, ?, ?, ?, ?, ?)`
    )
    .bind(monitorId, status, now, response_time, status_code, error)
    .run<MonitorStatusHistory>();
}

// 更新监控状态
export async function updateMonitorStatus(
  db: Bindings["DB"],
  monitorId: number,
  status: string,
  responseTime: number
) {
  // 使用ISO格式的时间戳
  const now = new Date().toISOString();

  return await db
    .prepare(
      `UPDATE monitors 
     SET status = ?, 
         last_checked = ?,
         response_time = ?,
         uptime = (
           SELECT ROUND((COUNT(CASE WHEN status = 'up' THEN 1 ELSE NULL END) * 100.0 / COUNT(*)), 2)
           FROM monitor_status_history
           WHERE monitor_id = ?
           ORDER BY timestamp DESC
           LIMIT 100
         )
     WHERE id = ?`
    )
    .bind(status, now, responseTime, monitorId, monitorId)
    .run();
}

// 记录监控出错状态
export async function recordMonitorError(
  db: Bindings["DB"],
  monitorId: number,
  response_time: number,
  errorMessage: string
) {
  // 记录错误状态
  await insertMonitorStatusHistory(
    db,
    monitorId,
    "down",
    response_time,
    0,
    errorMessage
  );

  // 使用ISO格式的时间戳
  const now = new Date().toISOString();

  // 更新监控状态
  return await db
    .prepare(
      `UPDATE monitors 
     SET status = 'down',
         last_checked = ?,
         response_time = 0,
         uptime = (
           SELECT ROUND((COUNT(CASE WHEN status = 'up' THEN 1 ELSE NULL END) * 100.0 / COUNT(*)), 2)
           FROM monitor_status_history
           WHERE monitor_id = ?
           ORDER BY timestamp DESC
           LIMIT 100
         )
     WHERE id = ?`
    )
    .bind(now, monitorId, monitorId)
    .run();
}

// 创建新监控
export async function createMonitor(
  db: Bindings["DB"],
  name: string,
  url: string,
  method: string = "GET",
  interval: number = 60,
  timeout: number = 30,
  expectedStatus: number = 200,
  headers: Record<string, string> = {},
  body: string = "",
  userId: number
) {
  const now = new Date().toISOString();

  const result = await db
    .prepare(
      `INSERT INTO monitors 
     (name, url, method, interval, timeout, expected_status, headers, body, created_by, active, status, uptime, response_time, last_checked, created_at, updated_at) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      name,
      url,
      method,
      interval,
      timeout,
      expectedStatus,
      JSON.stringify(headers),
      body,
      userId,
      1, // active
      "pending",
      100.0,
      0,
      null,
      now,
      now
    )
    .run();

  if (!result.success) {
    throw new Error("创建监控失败");
  }

  // 获取新创建的监控，解析 headers 字段
  const newMonitor = await db
    .prepare("SELECT * FROM monitors WHERE rowid = last_insert_rowid()")
    .first<Monitor>();

  if (newMonitor && typeof newMonitor.headers === "string") {
    try {
      newMonitor.headers = JSON.parse(newMonitor.headers);
    } catch (e) {
      newMonitor.headers = {};
    }
  }

  return newMonitor;
}

// 更新监控配置
export async function updateMonitorConfig(
  db: Bindings["DB"],
  id: number,
  updates: Partial<Monitor>
) {
  // 准备更新字段
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.name !== undefined) {
    fields.push("name = ?");
    values.push(updates.name);
  }

  if (updates.url !== undefined) {
    fields.push("url = ?");
    values.push(updates.url);
  }

  if (updates.method !== undefined) {
    fields.push("method = ?");
    values.push(updates.method);
  }

  if (updates.interval !== undefined) {
    fields.push("interval = ?");
    values.push(updates.interval);
  }

  if (updates.timeout !== undefined) {
    fields.push("timeout = ?");
    values.push(updates.timeout);
  }

  if (updates.expected_status !== undefined) {
    fields.push("expected_status = ?");
    values.push(updates.expected_status);
  }

  if (updates.headers !== undefined) {
    fields.push("headers = ?");
    values.push(JSON.stringify(updates.headers));
  }

  if (updates.body !== undefined) {
    fields.push("body = ?");
    values.push(updates.body);
  }

  if (updates.active !== undefined) {
    fields.push("active = ?");
    values.push(updates.active ? 1 : 0);
  }

  // 添加更新时间
  fields.push("updated_at = ?");
  values.push(new Date().toISOString());

  // 没有要更新的字段时返回
  if (fields.length === 0) {
    return { message: "没有提供要更新的字段" };
  }

  // 添加 ID 作为 WHERE 条件
  values.push(id);

  // 执行更新
  const result = await db
    .prepare(`UPDATE monitors SET ${fields.join(", ")} WHERE id = ?`)
    .bind(...values)
    .run();

  if (!result.success) {
    throw new Error("更新监控失败");
  }

  // 获取更新后的监控
  const updatedMonitor = await db
    .prepare("SELECT * FROM monitors WHERE id = ?")
    .bind(id)
    .first<Monitor>();

  // 解析 headers 字段
  if (updatedMonitor && typeof updatedMonitor.headers === "string") {
    try {
      updatedMonitor.headers = JSON.parse(updatedMonitor.headers);
    } catch (e) {
      updatedMonitor.headers = {};
    }
  }

  return updatedMonitor;
}

// 删除监控
export async function deleteMonitor(db: Bindings["DB"], id: number) {
  // 先删除关联的历史数据
  await db
    .prepare("DELETE FROM monitor_status_history WHERE monitor_id = ?")
    .bind(id)
    .run();

  // 执行删除监控
  return await db.prepare("DELETE FROM monitors WHERE id = ?").bind(id).run();
}

/**
 * 获取所有监控（根据用户角色过滤）
 * @param db 数据库连接
 * @param userId 用户ID
 * @param userRole 用户角色
 * @returns 监控列表和操作结果
 */
export async function getAllMonitors(
  db: Bindings["DB"],
  userId: number,
  userRole: string
) {
  try {
    // 根据用户角色过滤监控
    let result;
    if (userRole === "admin") {
      result = await db
        .prepare("SELECT * FROM monitors ORDER BY created_at DESC")
        .all<Monitor>();
    } else {
      result = await db
        .prepare(
          "SELECT * FROM monitors WHERE created_by = ? ORDER BY created_at DESC"
        )
        .bind(userId)
        .all<Monitor>();
    }

    // 解析所有监控的 headers 字段
    if (result.results && result.results.length > 0) {
      result.results.forEach((monitor) => {
        if (typeof monitor.headers === "string") {
          try {
            monitor.headers = JSON.parse(monitor.headers);
          } catch (e) {
            monitor.headers = {};
          }
        }
      });

      // 获取所有监控的历史状态数据
      const monitorsWithHistory = await Promise.all(
        result.results.map(async (monitor) => {
          const historyResult = await db
            .prepare(
              `SELECT * FROM monitor_status_history 
           WHERE monitor_id = ? 
           ORDER BY timestamp ASC`
            )
            .bind(monitor.id)
            .all<MonitorStatusHistory>();

          return {
            ...monitor,
            history: historyResult.results || [],
          };
        })
      );

      return {
        success: true,
        monitors: monitorsWithHistory,
        status: 200,
      };
    }

    return {
      success: true,
      monitors: result.results || [],
      status: 200,
    };
  } catch (error) {
    console.error("获取监控列表错误:", error);
    return {
      success: false,
      message: "获取监控列表失败",
      error: error instanceof Error ? error.message : String(error),
      status: 500,
    };
  }
}

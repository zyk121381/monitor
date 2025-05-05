import {
  Bindings,
  Monitor,
  MonitorStatusHistory,
  DbResultMeta,
  MonitorDailyStats,
} from "../models";

/**
 * 监控相关的数据库操作
 */

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

// 获取所有监控
export async function getAllMonitors(db: Bindings["DB"]) {
  const result = await db
    .prepare("SELECT * FROM monitors ORDER BY created_at DESC")
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

  return {
    success: true,
    monitors: result.results || [],
    status: 200,
  };
}

// 获取单个监控状态历史 24小时内
export async function getMonitorStatusHistoryIn24h(
  db: Bindings["DB"],
  monitorId: number
) {
  return await db
    .prepare(
      `SELECT * FROM monitor_status_history_24h 
     WHERE monitor_id = ? 
     ORDER BY timestamp ASC`
    )
    .bind(monitorId)
    .all<MonitorStatusHistory>();
}

// 获取所有监控状态历史 24小时内
export async function getAllMonitorStatusHistoryIn24h(db: Bindings["DB"]) {
  return await db
    .prepare(
      `SELECT * FROM monitor_status_history_24h
     ORDER BY timestamp ASC`
    )
    .all<MonitorStatusHistory>();
}
// 记录监控状态历史到热表
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
      `INSERT INTO monitor_status_history_24h (monitor_id, status, timestamp, response_time, status_code, error) 
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
     WHERE id = ?`
    )
    .bind(status, now, responseTime, monitorId)
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
     (name, url, method, interval, timeout, expected_status, headers, body, created_by, active, status, response_time, last_checked, created_at, updated_at) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
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
    .prepare("DELETE FROM monitor_status_history_24h WHERE monitor_id = ?")
    .bind(id)
    .run();

  // 删除每日统计数据
  await db
    .prepare("DELETE FROM monitor_daily_stats WHERE monitor_id = ?")
    .bind(id)
    .run();

  // 执行删除监控
  return await db.prepare("DELETE FROM monitors WHERE id = ?").bind(id).run();
}

export async function getMonitorDailyStatsById(db: Bindings["DB"], id: number) {
  // 查询每日统计数据
  const result = await db
    .prepare(
      `
      SELECT 
        date,
        total_checks,
        up_checks,
        down_checks,
        avg_response_time,
        min_response_time,
        max_response_time,
        availability
      FROM 
        monitor_daily_stats
      WHERE 
        monitor_id = ?
      ORDER BY
        date ASC
    `
    )
    .bind(id)
    .all<MonitorDailyStats>();

  return result;
}

/**
 * 获取所有监控的每日统计数据
 * @param db 数据库连接
 * @returns 所有监控的每日统计数据和操作结果
 */
export async function getAllMonitorDailyStats(db: Bindings["DB"]) {
  return await db
    .prepare("SELECT * FROM monitor_daily_stats ORDER BY date ASC")
    .all<MonitorDailyStats>();
}

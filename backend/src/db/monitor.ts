import { Bindings } from '../models/db';
import { Monitor, MonitorStatusHistory, MonitorCheck } from '../models/monitor';

// 定义操作结果的元数据类型
interface DbResultMeta {
  changes?: number;
  [key: string]: any;
}

/**
 * 监控相关的数据库操作
 */

// 清理30天以前的历史记录
export async function cleanupOldRecords(db: Bindings['DB']) {
  try {
    console.log('开始清理30天以前的历史记录...');
    
    // 清理监控状态历史记录
    const deleteStatusHistoryResult = await db.prepare(`
      DELETE FROM monitor_status_history 
      WHERE timestamp < datetime('now', '-30 days')
    `).run();
    
    // 清理监控检查记录
    const deleteChecksResult = await db.prepare(`
      DELETE FROM monitor_checks 
      WHERE checked_at < datetime('now', '-30 days')
    `).run();
    
    // 清理通知历史记录
    const deleteNotificationHistoryResult = await db.prepare(`
      DELETE FROM notification_history 
      WHERE sent_at < datetime('now', '-30 days')
    `).run();
    
    const statusHistoryDeleted = (deleteStatusHistoryResult.meta as DbResultMeta)?.changes || 0;
    const checksDeleted = (deleteChecksResult.meta as DbResultMeta)?.changes || 0;
    const notificationHistoryDeleted = (deleteNotificationHistoryResult.meta as DbResultMeta)?.changes || 0;
    
    console.log(`清理完成：删除了 ${statusHistoryDeleted} 条状态历史记录，${checksDeleted} 条检查记录，${notificationHistoryDeleted} 条通知历史记录`);
    
    return {
      success: true,
      statusHistoryDeleted,
      checksDeleted,
      notificationHistoryDeleted
    };
  } catch (error) {
    console.error('清理历史记录出错:', error);
    return { success: false, error: String(error) };
  }
}

// 获取需要检查的监控列表
export async function getMonitorsToCheck(db: Bindings['DB']) {
  return await db.prepare(`
    SELECT * FROM monitors 
    WHERE active = true 
    AND (last_checked IS NULL OR datetime('now') > datetime(last_checked, '+' || interval || ' seconds'))
  `).all();
}

// 获取单个监控详情
export async function getMonitorById(db: Bindings['DB'], id: number) {
  return await db.prepare(
    'SELECT * FROM monitors WHERE id = ?'
  ).bind(id).first<Monitor>();
}

// 获取监控状态历史
export async function getMonitorStatusHistory(db: Bindings['DB'], monitorId: number) {
  return await db.prepare(
    `SELECT * FROM monitor_status_history 
     WHERE monitor_id = ? 
     ORDER BY timestamp ASC`
  ).bind(monitorId).all<MonitorStatusHistory>();
}

// 获取监控检查记录
export async function getMonitorChecks(db: Bindings['DB'], monitorId: number, limit: number = 5) {
  return await db.prepare(
    `SELECT * FROM monitor_checks 
     WHERE monitor_id = ? 
     ORDER BY checked_at DESC 
     LIMIT ?`
  ).bind(monitorId, limit).all();
}

// 记录监控状态历史
export async function insertMonitorStatusHistory(db: Bindings['DB'], monitorId: number, status: string) {
  // 使用ISO格式的时间戳
  const now = new Date().toISOString();
  
  return await db.prepare(
    `INSERT INTO monitor_status_history (monitor_id, status, timestamp) 
     VALUES (?, ?, ?)`
  ).bind(monitorId, status, now).run();
}

// 记录监控检查详情 - 正常情况
export async function insertMonitorCheck(
  db: Bindings['DB'], 
  monitorId: number, 
  status: string, 
  responseTime: number, 
  statusCode: number | null, 
  error: string | null = null
) {
  // 使用ISO格式的时间戳
  const now = new Date().toISOString();
  
  return await db.prepare(
    `INSERT INTO monitor_checks
     (monitor_id, status, response_time, status_code, error, checked_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).bind(monitorId, status, responseTime, statusCode, error, now).run();
}

// 更新监控状态
export async function updateMonitorStatus(
  db: Bindings['DB'], 
  monitorId: number, 
  status: string, 
  responseTime: number
) {
  // 使用ISO格式的时间戳
  const now = new Date().toISOString();
  
  return await db.prepare(
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
  ).bind(status, now, responseTime, monitorId, monitorId).run();
}

// 记录监控出错状态
export async function recordMonitorError(
  db: Bindings['DB'], 
  monitorId: number, 
  errorMessage: string
) {
  // 记录错误状态
  await insertMonitorStatusHistory(db, monitorId, 'down');
  
  // 记录检查详情
  await insertMonitorCheck(db, monitorId, 'down', 0, 0, errorMessage);
  
  // 使用ISO格式的时间戳
  const now = new Date().toISOString();
  
  // 更新监控状态 - 修复SQL语法错误(去掉多余的P)
  return await db.prepare(
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
  ).bind(now, monitorId, monitorId).run();
}

/**
 * 检查单个监控 - 抽象通用的监控检查逻辑
 * @param db 数据库连接
 * @param monitor 监控对象
 * @param updateRecords 是否更新数据库记录
 * @returns 检查结果
 */
export async function checkSingleMonitor(
  db: Bindings['DB'], 
  monitor: Monitor
) {
  try {
    console.log(`开始检查监控项: ${monitor.name} (${monitor.url})`);
    
    const startTime = Date.now();
    let response;
    let error = null;
    
    // 解析 headers
    let customHeaders = {};
    try {
      customHeaders = JSON.parse(monitor.headers || '{}');
    } catch (e) {
      console.error('解析请求头错误:', e);
    }
    
    try {
      const controller = new AbortController();
      // 设置超时
      const timeoutId = setTimeout(() => controller.abort(), monitor.timeout * 1000);
      
      response = await fetch(monitor.url, {
        method: monitor.method,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Sec-Ch-Ua': '"Google Chrome";v="123", "Not:A-Brand";v="8"',
          'Sec-Ch-Ua-Mobile': '?0',
          'Sec-Ch-Ua-Platform': '"macOS"',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
          'Upgrade-Insecure-Requests': '1',
          'Referer': new URL(monitor.url).origin,
          ...customHeaders
        },
        body: monitor.method !== 'GET' && monitor.method !== 'HEAD' ? monitor.body : undefined,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    }
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    // 检查响应状态
    let isUp = false;
    
    // 支持状态码范围检查
    if (monitor.expected_status === 2) {
      // 如果是2，则表示2xx
      isUp = response ? (response.status >= 200 && response.status < 300) : false;
    } else if (monitor.expected_status === 3) {
      // 如果是3，则表示3xx
      isUp = response ? (response.status >= 300 && response.status < 400) : false;
    } else if (monitor.expected_status === 4) {
      // 如果是4，则表示4xx
      isUp = response ? (response.status >= 400 && response.status < 500) : false;
    } else if (monitor.expected_status === 5) {
      // 如果是5，则表示5xx
      isUp = response ? (response.status >= 500 && response.status < 600) : false;
    } else {
      // 其他情况，精确匹配
      isUp = response ? (response.status === monitor.expected_status) : false;
    }
    
    const status = isUp ? 'up' : 'down';
    const now = new Date().toISOString();
    
    // 添加调试日志
    console.log(`监控状态判断: 返回状态码=${response?.status}, 期望状态码=${monitor.expected_status}, 最终状态=${status}`);
  
    // 记录状态历史
    await insertMonitorStatusHistory(db, monitor.id, status);
    
    // 添加检查记录
    await insertMonitorCheck(
    db,
    monitor.id,
    status,
    responseTime,
    response ? response.status : null,
    error
    );
      
    // 更新监控状态
    await updateMonitorStatus(db, monitor.id, status, responseTime);
    
    console.log(`监控项检查完成: ${monitor.name}, 状态: ${status}, 响应时间: ${responseTime}ms`);
    
    return {
      success: true,
      status,
      responseTime,
      statusCode: response ? response.status : null,
      error,
      checked_at: now,
      previous_status: monitor.status,
      monitor_id: monitor.id,
      name: monitor.name
    };
  } catch (error: any) {
    console.error(`检查监控项失败: ${monitor.name}`, error);
    
    // 记录错误状态和更新监控状态
    await recordMonitorError(db, monitor.id, error.message);
    
    return {
      success: false,
      status: 'down',
      error: error.message,
      checked_at: new Date().toISOString(),
      previous_status: monitor.status,
      monitor_id: monitor.id,
      name: monitor.name
    };
  }
} 
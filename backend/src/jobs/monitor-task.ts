import { Hono } from "hono";
import { Bindings } from "../models/db";
import { Monitor } from "../models/monitor";
import {
  getMonitorsToCheck,
  checkSingleMonitor as monitorServiceCheck,
} from "../services";
import { shouldSendNotification, sendNotification } from "../services";

const monitorTask = new Hono<{ Bindings: Bindings }>();

// 监控检查的主要函数
async function checkMonitors(c: any) {
  try {
    console.log("开始执行监控检查...");
    // 获取当前时间
    const now = new Date();

    // 查询需要检查的监控
    const monitors = await getMonitorsToCheck(c.env.DB);

    console.log(`找到 ${monitors?.results?.length || 0} 个需要检查的监控`);

    if (!monitors.results || monitors.results.length === 0) {
      return { success: true, message: "没有需要检查的监控", checked: 0 };
    }

    // 检查每个监控
    const results = await Promise.all(
      monitors.results.map(async (monitorItem: any) => {
        // 确保正确的类型转换
        const monitor = monitorItem as Monitor;
        const checkResult = await checkSingleMonitor(c, monitor);

        // 处理通知
        await handleMonitorNotification(c, monitor, checkResult);

        return checkResult;
      })
    );

    return {
      success: true,
      message: "监控检查完成",
      checked: results.length,
      results: results,
    };
  } catch (error) {
    console.error("监控检查出错:", error);
    return { success: false, message: "监控检查出错", error: String(error) };
  }
}

// 检查单个监控的函数
async function checkSingleMonitor(c: any, monitor: Monitor) {
  // 使用服务层的检查函数
  return await monitorServiceCheck(c.env.DB, monitor);
}

// 处理监控通知
async function handleMonitorNotification(
  c: any,
  monitor: Monitor,
  checkResult: any
) {
  try {
    console.log(`======= 通知检查开始 =======`);
    console.log(`监控: ${monitor.name} (ID: ${monitor.id})`);
    console.log(
      `上一状态: ${checkResult.previous_status}, 当前状态: ${checkResult.status}`
    );

    // 如果监控状态没有变化，不需要继续处理
    if (checkResult.status === checkResult.previous_status) {
      console.log(`状态未变化，不发送通知`);
      return;
    }

    console.log(
      `状态已变化: ${checkResult.previous_status} -> ${checkResult.status}`
    );

    // 检查是否需要发送通知
    console.log(`检查通知设置...`);
    const notificationCheck = await shouldSendNotification(
      c.env.DB,
      "monitor",
      monitor.id,
      checkResult.previous_status,
      checkResult.status
    );

    console.log(
      `通知判断结果: shouldSend=${
        notificationCheck.shouldSend
      }, channels=${JSON.stringify(notificationCheck.channels)}`
    );

    if (
      !notificationCheck.shouldSend ||
      notificationCheck.channels.length === 0
    ) {
      console.log(
        `监控 ${monitor.name} (ID: ${monitor.id}) 状态变更，但不需要发送通知`
      );
      return;
    }

    console.log(
      `监控 ${monitor.name} (ID: ${monitor.id}) 状态变更，正在发送通知...`
    );
    console.log(`通知渠道: ${JSON.stringify(notificationCheck.channels)}`);

    // 准备通知变量
    const variables = {
      name: monitor.name,
      status: checkResult.status,
      previous_status: checkResult.previous_status || "未知",
      time: new Date().toLocaleString("zh-CN"),
      url: monitor.url,
      response_time: `${checkResult.responseTime}ms`,
      status_code: checkResult.statusCode
        ? checkResult.statusCode.toString()
        : "无",
      expected_status: monitor.expected_status.toString(),
      error: checkResult.error || "无",
      details: `URL: ${monitor.url}\n响应时间: ${
        checkResult.responseTime
      }ms\n状态码: ${checkResult.statusCode || "无"}\n错误信息: ${
        checkResult.error || "无"
      }`,
    };

    console.log(`通知变量: ${JSON.stringify(variables)}`);

    // 发送通知
    console.log(`开始发送通知...`);
    const notificationResult = await sendNotification(
      c.env.DB,
      "monitor",
      monitor.id,
      variables,
      notificationCheck.channels
    );

    console.log(`通知发送结果: ${JSON.stringify(notificationResult)}`);

    if (notificationResult.success) {
      console.log(`监控 ${monitor.name} (ID: ${monitor.id}) 通知发送成功`);
    } else {
      console.error(`监控 ${monitor.name} (ID: ${monitor.id}) 通知发送失败`);
    }
    console.log(`======= 通知检查结束 =======`);
  } catch (error) {
    console.error(
      `处理监控通知时出错 (${monitor.name}, ID: ${monitor.id}):`,
      error
    );
  }
}

// 生成每日监控统计数据的函数
async function generateDailyStats(c: any) {
  try {
    console.log("开始生成每日监控统计数据...");
    
    // 获取前一天的日期 (YYYY-MM-DD 格式)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];
    
    console.log(`正在处理日期 ${dateStr} 的数据`);
    
    // 时间范围
    const startTime = `${dateStr}T00:00:00.000Z`;
    const endTime = `${dateStr}T23:59:59.999Z`;
    
    // 一次性获取所有监控
    const monitorsResult = await c.env.DB.prepare(
      "SELECT id, name FROM monitors"
    ).all();
    
    if (!monitorsResult.results || monitorsResult.results.length === 0) {
      console.log("没有找到监控");
      return { success: true, message: "没有监控", processed: 0 };
    }
    
    const monitors = monitorsResult.results;
    console.log(`找到 ${monitors.length} 个监控`);
    
    // 创建监控ID列表
    const monitorIds = monitors.map((m: any) => m.id);
    
    // 一次性获取所有监控历史记录（指定日期范围内）
    console.log(`一次性查询所有监控在 ${startTime} 至 ${endTime} 的历史记录`);
    
    const historyResult = await c.env.DB.prepare(`
      SELECT 
        monitor_id, 
        status, 
        response_time 
      FROM 
        monitor_status_history 
      WHERE 
        timestamp >= ? AND 
        timestamp <= ?
    `)
    .bind(startTime, endTime)
    .all();
    
    if (!historyResult.results || historyResult.results.length === 0) {
      console.log(`在 ${dateStr} 没有找到任何监控历史记录`);
      return { success: true, message: "没有历史记录", processed: 0 };
    }
    
    console.log(`找到 ${historyResult.results.length} 条历史记录`);
    
    // 按监控ID分组处理数据
    const statsMap = new Map();
    
    // 初始化每个监控的统计数据结构
    for (const monitorId of monitorIds) {
      statsMap.set(monitorId, {
        monitorId,
        totalChecks: 0,
        upChecks: 0,
        downChecks: 0,
        responseTimes: [],
        avgResponseTime: 0,
        minResponseTime: 0,
        maxResponseTime: 0,
        availability: 0
      });
    }
    
    // 处理所有历史记录
    for (const record of historyResult.results) {
      const monitorId = record.monitor_id;
      
      // 如果这个监控ID不在我们的列表中，跳过
      if (!statsMap.has(monitorId)) continue;
      
      const stats = statsMap.get(monitorId);
      stats.totalChecks++;
      
      // 统计状态
      if (record.status === 'up') {
        stats.upChecks++;
      } else if (record.status === 'down') {
        stats.downChecks++;
      }
      
      // 收集响应时间数据
      if (record.response_time != null && record.response_time > 0) {
        stats.responseTimes.push(record.response_time);
      }
    }
    
    // 处理每个监控的响应时间统计和可用率计算
    for (const [monitorId, stats] of statsMap.entries()) {
      // 只处理有记录的监控
      if (stats.totalChecks === 0) continue;
      
      // 计算响应时间统计数据
      if (stats.responseTimes.length > 0) {
        stats.avgResponseTime = stats.responseTimes.reduce((sum: number, time: number) => sum + time, 0) / stats.responseTimes.length;
        stats.minResponseTime = Math.min(...stats.responseTimes);
        stats.maxResponseTime = Math.max(...stats.responseTimes);
      }
      
      // 计算可用率
      stats.availability = stats.totalChecks > 0 ? (stats.upChecks / stats.totalChecks) * 100 : 0;
      
      // 删除临时数据
      delete stats.responseTimes;
    }
    
    // 将数据写入数据库
    const now = new Date().toISOString();
    let processed = 0;
    
    // 批量构建 INSERT 语句
    for (const [monitorId, stats] of statsMap.entries()) {
      // 跳过没有记录的监控
      if (stats.totalChecks === 0) continue;
      
      const monitor = monitors.find((m: any) => m.id === monitorId);
      const monitorName = monitor ? monitor.name : `ID: ${monitorId}`;
      
      try {
        console.log(`监控 ${monitorName} (ID: ${monitorId}) 数据: 总检查=${stats.totalChecks}, 正常=${stats.upChecks}, 故障=${stats.downChecks}, 可用率=${stats.availability.toFixed(2)}%`);
        
        // 使用 UPSERT 操作
        await c.env.DB.prepare(`
          INSERT INTO monitor_daily_stats (
            monitor_id,
            date,
            total_checks,
            up_checks,
            down_checks,
            avg_response_time,
            min_response_time,
            max_response_time,
            availability,
            created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(monitor_id, date) DO UPDATE SET
            total_checks = excluded.total_checks,
            up_checks = excluded.up_checks,
            down_checks = excluded.down_checks,
            avg_response_time = excluded.avg_response_time,
            min_response_time = excluded.min_response_time,
            max_response_time = excluded.max_response_time,
            availability = excluded.availability
        `).bind(
          monitorId,
          dateStr,
          stats.totalChecks,
          stats.upChecks,
          stats.downChecks,
          stats.avgResponseTime,
          stats.minResponseTime,
          stats.maxResponseTime,
          stats.availability,
          now
        ).run();
        
        processed++;
        console.log(`成功更新监控 ID ${monitorId} 的每日统计数据`);
      } catch (error) {
        console.error(`更新监控 ID ${monitorId} 的每日统计数据时出错:`, error);
      }
    }
    
    console.log(`每日统计数据生成完成，成功处理了 ${processed} 个监控`);
    
    return {
      success: true,
      message: "每日统计数据生成完成",
      processed: processed,
      date: dateStr
    };
  } catch (error) {
    console.error("生成每日统计数据时出错:", error);
    return { 
      success: false, 
      message: "生成每日统计数据时出错", 
      error: String(error) 
    };
  }
}

// 在 Cloudflare Workers 中设置定时触发器
export default {
  async scheduled(event: any, env: any, ctx: any) {
    const c = { env };
    
    // 默认执行监控检查任务
    let result: any = await checkMonitors(c);

    const now = new Date();
    const hour = now.getUTCHours();
    const minute = now.getUTCMinutes();
    
    if (hour === 0 && minute === 5) {
      const statsResult = await generateDailyStats(c);
      result = { monitorCheck: result, dailyStats: statsResult };
    }
    
    return result;
  },
  fetch: monitorTask.fetch,
};

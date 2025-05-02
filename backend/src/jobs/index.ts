// 导出所有定时任务
import monitorTask from "./monitor-task";
import agentTask from "./agent-task";
import { Bindings } from "../models/db";
// 统一的定时任务处理函数
export const runScheduledTasks = async (event: any, env: any, ctx: any) => {
  try {
    // 执行监控检查任务
    await monitorTask.scheduled(event, env, ctx);

    // 执行客户端状态检查任务
    await agentTask.scheduled(event, env, ctx);

    // 执行清理任务 - 每30天执行一次
    const now = new Date();
    const dayOfMonth = now.getDate();
    const hour = now.getHours();
    const minute = now.getMinutes();
    if (dayOfMonth === 1 && hour === 0 && minute === 30) {
      console.log("每月1号零点30分执行清理任务...");
      await cleanupOldRecords(env.DB);
    }
  } catch (error) {
    console.error("定时任务执行出错:", error);
  }
};

// 清理30天以前的历史记录
export async function cleanupOldRecords(db: Bindings["DB"]) {
  console.log("开始清理30天以前的历史记录...");

  // 清理30天以前的 monitor_daily_stats
  await db.prepare(
      `
      DELETE FROM monitor_daily_stats
      WHERE date < datetime('now', '-30 days')
    `
    )
    .run();

  // 清理通知历史记录
  await db
    .prepare(
      `
      DELETE FROM notification_history 
      WHERE sent_at < datetime('now', '-30 days')
    `
    )
    .run();

  return {
    success: true,
  };
}

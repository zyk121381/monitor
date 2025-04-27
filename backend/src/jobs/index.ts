// 导出所有定时任务
import monitorTask from "./monitor-task";
import { checkAgentsStatus } from "./agent-task";
import { cleanupOldRecords } from "../repositories/monitor";
// 统一的定时任务处理函数
export const runScheduledTasks = async (event: any, env: any, ctx: any) => {
  try {
    // 执行监控检查任务
    await monitorTask.scheduled(event, env, ctx);

    // 执行客户端状态检查任务
    await checkAgentsStatus(env);

    // 执行清理任务 - 每季度第一天执行
    const now = new Date();
    const isFirstDayOfQuarter =
      now.getDate() === 1 && [0, 3, 6, 9].includes(now.getMonth());
    if (isFirstDayOfQuarter) {
      console.log("执行季度清理任务...");
      await cleanupOldRecords(env);
    }
  } catch (error) {
    console.error("定时任务执行出错:", error);
  }
};

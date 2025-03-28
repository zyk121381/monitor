import { Hono } from 'hono';
import { Bindings } from '../models/db';
import { Monitor } from '../models/monitor';
import * as monitorDb from '../db/monitor';

const monitorTask = new Hono<{ Bindings: Bindings }>();

// 监控检查的主要函数
async function checkMonitors(c: any) {
  try {
    console.log('开始执行监控检查...');
    
    // 清理30天以前的历史记录
    await monitorDb.cleanupOldRecords(c.env.DB);
    
    // 获取当前时间
    const now = new Date();
    
    // 查询需要检查的监控
    const monitors = await monitorDb.getMonitorsToCheck(c.env.DB);
    
    console.log(`找到 ${monitors?.results?.length || 0} 个需要检查的监控`);
    
    if (!monitors.results || monitors.results.length === 0) {
      return { success: true, message: '没有需要检查的监控', checked: 0 };
    }
    
    // 检查每个监控
    const results = await Promise.all(monitors.results.map(async (monitorItem: any) => {
      // 确保正确的类型转换
      const monitor = monitorItem as Monitor;
      return await checkSingleMonitor(c, monitor);
    }));
    
    return { 
      success: true, 
      message: '监控检查完成', 
      checked: results.length,
      results: results
    };
  } catch (error) {
    console.error('监控检查出错:', error);
    return { success: false, message: '监控检查出错', error: String(error) };
  }
}

// 检查单个监控的函数
async function checkSingleMonitor(c: any, monitor: Monitor) {
  // 使用抽象出来的通用检查监控函数
  return await monitorDb.checkSingleMonitor(c.env.DB, monitor);
}

// 定义触发器路由 - 通过HTTP请求触发监控检查
monitorTask.get('/api/trigger-check', async (c) => {
  const result = await checkMonitors(c);
  return c.json(result);
});

// 在 Cloudflare Workers 中设置定时触发器
export default {
  async scheduled(event: any, env: any, ctx: any) {
    const c = { env };
    await checkMonitors(c);
  },
  fetch: monitorTask.fetch
}; 
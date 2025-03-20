import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import { jwt } from 'hono/jwt';
import { Bindings } from './models/db';
import { prettyJSON } from 'hono/pretty-json';

// 声明环境变量类型
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV?: string;
      PORT?: string;
      JWT_SECRET?: string;
    }
  }
}

// 定义 D1 数据库类型
interface D1Database {
  prepare(query: string): D1PreparedStatement;
  dump(): Promise<ArrayBuffer>;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
  exec<T = unknown>(query: string): Promise<D1Result<T>>;
}

interface D1PreparedStatement {
  bind(...values: any[]): D1PreparedStatement;
  first<T = unknown>(colName?: string): Promise<T>;
  run<T = unknown>(): Promise<D1Result<T>>;
  all<T = unknown>(): Promise<D1Result<T>>;
  raw<T = unknown>(): Promise<T[]>;
}

interface D1Result<T = unknown> {
  results?: T[];
  success: boolean;
  error?: string;
  meta?: object;
}

// 导入路由
import authRoutes from './routes/auth';
import monitorRoutes from './routes/monitors';
import agentRoutes from './routes/agents';
import userRoutes from './routes/users';
import statusRoutes from './routes/status';
import initDbRoutes from './setup/database';
import { monitorTask, runScheduledTasks } from './tasks';

// 创建Hono应用
const app = new Hono<{ Bindings: Bindings }>();

// 中间件
app.use('*', logger());
app.use('*', cors({
  origin: ['http://localhost:5173', 'https://XUGOU.pages.dev'], // 允许前端开发服务器和生产环境
  credentials: true,
}));
app.use('*', prettyJSON());

// 公共路由
app.get('/', (c) => c.json({ message: 'XUGOU API 服务正在运行' }));

// 获取 JWT 密钥
const getJwtSecret = (c: any) => {
  // 在 Cloudflare Workers 环境中，使用 env 变量
  if (typeof process === 'undefined') {
    return c.env.JWT_SECRET || 'your-secret-key-change-in-production';
  }
  // 在 Node.js 环境中，使用 process.env
  return process.env.JWT_SECRET || 'your-secret-key-change-in-production';
};

// 路由注册
app.route('/api/auth', authRoutes);
app.route('/api/monitors', monitorRoutes);
app.route('/api/agents', agentRoutes);
app.route('/api/users', userRoutes);
app.route('/api/status', statusRoutes);
app.route('/api', initDbRoutes);

// 添加监控检查触发路由
app.get('/api/trigger-check', async (c) => {
  const { scheduled } = monitorTask;
  if (scheduled) {
    await scheduled(null, c.env, null);
  }
  return c.json({ success: true, message: '监控检查已触发' });
});

// 导出 fetch 函数供 Cloudflare Workers 使用
export default {
  // 处理 HTTP 请求
  fetch: app.fetch.bind(app),
  
  // 添加定时任务，每分钟执行一次监控检查和客户端状态检查
  async scheduled(event: any, env: any, ctx: any) {
    try {
      // 执行所有定时任务
      await runScheduledTasks(event, env, ctx);
    } catch (error) {
      console.error('定时任务执行出错:', error);
    }
  }
}; 
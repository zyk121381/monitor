"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const hono_1 = require("hono");
const logger_1 = require("hono/logger");
const cors_1 = require("hono/cors");
const pretty_json_1 = require("hono/pretty-json");
// 导入路由
const auth_1 = __importDefault(require("./routes/auth"));
const monitors_1 = __importDefault(require("./routes/monitors"));
const agents_1 = __importDefault(require("./routes/agents"));
const users_1 = __importDefault(require("./routes/users"));
const status_1 = __importDefault(require("./routes/status"));
const database_1 = __importDefault(require("./setup/database"));
const tasks_1 = require("./tasks");
// 创建Hono应用
const app = new hono_1.Hono();
// 中间件
app.use('*', (0, logger_1.logger)());
app.use('*', (0, cors_1.cors)({
    origin: ['http://localhost:5173', 'https://XUGOU.pages.dev'], // 允许前端开发服务器和生产环境
    credentials: true,
}));
app.use('*', (0, pretty_json_1.prettyJSON)());
// 公共路由
app.get('/', (c) => c.json({ message: 'XUGOU API 服务正在运行' }));
// 获取 JWT 密钥
const getJwtSecret = (c) => {
    // 在 Cloudflare Workers 环境中，使用 env 变量
    if (typeof process === 'undefined') {
        return c.env.JWT_SECRET || 'your-secret-key-change-in-production';
    }
    // 在 Node.js 环境中，使用 process.env
    return process.env.JWT_SECRET || 'your-secret-key-change-in-production';
};
// 路由注册
app.route('/api/auth', auth_1.default);
app.route('/api/monitors', monitors_1.default);
app.route('/api/agents', agents_1.default);
app.route('/api/users', users_1.default);
app.route('/api/status', status_1.default);
app.route('/api', database_1.default);
// 添加监控检查触发路由
app.get('/api/trigger-check', async (c) => {
    const { scheduled } = tasks_1.monitorTask;
    if (scheduled) {
        await scheduled(null, c.env, null);
    }
    return c.json({ success: true, message: '监控检查已触发' });
});
// 导出 fetch 函数供 Cloudflare Workers 使用
exports.default = {
    // 处理 HTTP 请求
    fetch: app.fetch.bind(app),
    // 添加定时任务，每分钟执行一次监控检查和客户端状态检查
    async scheduled(event, env, ctx) {
        try {
            // 执行所有定时任务
            await (0, tasks_1.runScheduledTasks)(event, env, ctx);
        }
        catch (error) {
            console.error('定时任务执行出错:', error);
        }
    }
};
//# sourceMappingURL=index.js.map
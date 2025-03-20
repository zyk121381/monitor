"use strict";
// 初始化数据库脚本
// 用于在 Cloudflare Workers 环境中创建数据库表和初始数据
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const hono_1 = require("hono");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const initDb = new hono_1.Hono();
// 初始化数据库路由
initDb.get('/init-db', async (c) => {
    try {
        console.log('开始初始化数据库...');
        // 先删除已有的表
        console.log('删除已有的表...');
        try {
            await c.env.DB.exec("DROP TABLE IF EXISTS status_page_agents");
            await c.env.DB.exec("DROP TABLE IF EXISTS status_page_monitors");
            await c.env.DB.exec("DROP TABLE IF EXISTS status_page_config");
            await c.env.DB.exec("DROP TABLE IF EXISTS monitor_status_history");
            await c.env.DB.exec("DROP TABLE IF EXISTS monitor_checks");
            await c.env.DB.exec("DROP TABLE IF EXISTS metrics");
            await c.env.DB.exec("DROP TABLE IF EXISTS agents");
            await c.env.DB.exec("DROP TABLE IF EXISTS monitors");
            await c.env.DB.exec("DROP TABLE IF EXISTS users");
        }
        catch (error) {
            console.log('删除表出错，可能表不存在:', error);
        }
        console.log('创建用户表...');
        // 创建用户表
        await c.env.DB.exec("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL UNIQUE, password TEXT NOT NULL, email TEXT, role TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)");
        console.log('创建监控表...');
        // 创建监控表（单行格式）
        await c.env.DB.exec("CREATE TABLE IF NOT EXISTS monitors (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, url TEXT NOT NULL, method TEXT NOT NULL, interval INTEGER NOT NULL, timeout INTEGER NOT NULL, expected_status INTEGER NOT NULL, headers TEXT NOT NULL, body TEXT, created_by INTEGER NOT NULL, active BOOLEAN NOT NULL, status TEXT DEFAULT 'pending', uptime REAL DEFAULT 100.0, response_time INTEGER DEFAULT 0, last_checked TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, FOREIGN KEY (created_by) REFERENCES users(id))");
        console.log('创建监控历史记录表...');
        // 创建监控历史记录表（单行格式）
        await c.env.DB.exec("CREATE TABLE IF NOT EXISTS monitor_checks (id INTEGER PRIMARY KEY AUTOINCREMENT, monitor_id INTEGER NOT NULL, status TEXT NOT NULL, response_time INTEGER, status_code INTEGER, error TEXT, checked_at TEXT DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (monitor_id) REFERENCES monitors(id))");
        console.log('创建监控状态历史表...');
        // 创建监控状态历史表（单行格式）
        await c.env.DB.exec("CREATE TABLE IF NOT EXISTS monitor_status_history (id INTEGER PRIMARY KEY AUTOINCREMENT, monitor_id INTEGER NOT NULL, status TEXT NOT NULL, timestamp TEXT DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (monitor_id) REFERENCES monitors(id))");
        console.log('创建客户端表...');
        // 创建客户端表
        await c.env.DB.exec("CREATE TABLE IF NOT EXISTS agents (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, description TEXT, token TEXT NOT NULL UNIQUE, created_by INTEGER NOT NULL, active BOOLEAN NOT NULL, last_seen TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, FOREIGN KEY (created_by) REFERENCES users(id))");
        console.log('创建指标表...');
        // 创建指标表
        await c.env.DB.exec("CREATE TABLE IF NOT EXISTS metrics (id INTEGER PRIMARY KEY AUTOINCREMENT, agent_id INTEGER NOT NULL, timestamp TEXT NOT NULL, cpu_usage REAL NOT NULL, cpu_cores INTEGER NOT NULL, memory_total INTEGER NOT NULL, memory_used INTEGER NOT NULL, memory_free INTEGER NOT NULL, disk_total INTEGER NOT NULL, disk_used INTEGER NOT NULL, disk_free INTEGER NOT NULL, network_rx INTEGER NOT NULL, network_tx INTEGER NOT NULL, FOREIGN KEY (agent_id) REFERENCES agents(id))");
        console.log('创建状态页配置表...');
        // 创建状态页配置表
        await c.env.DB.exec("CREATE TABLE IF NOT EXISTS status_page_config (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, title TEXT NOT NULL DEFAULT '系统状态', description TEXT DEFAULT '系统当前运行状态', logo_url TEXT DEFAULT '', custom_css TEXT DEFAULT '', created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id))");
        console.log('创建状态页监控项关联表...');
        // 创建状态页监控项关联表
        await c.env.DB.exec("CREATE TABLE IF NOT EXISTS status_page_monitors (config_id INTEGER NOT NULL, monitor_id INTEGER NOT NULL, PRIMARY KEY (config_id, monitor_id), FOREIGN KEY (config_id) REFERENCES status_page_config(id) ON DELETE CASCADE, FOREIGN KEY (monitor_id) REFERENCES monitors(id) ON DELETE CASCADE)");
        console.log('创建状态页客户端关联表...');
        // 创建状态页客户端关联表
        await c.env.DB.exec("CREATE TABLE IF NOT EXISTS status_page_agents (config_id INTEGER NOT NULL, agent_id INTEGER NOT NULL, PRIMARY KEY (config_id, agent_id), FOREIGN KEY (config_id) REFERENCES status_page_config(id) ON DELETE CASCADE, FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE)");
        console.log('检查管理员用户...');
        // 检查是否已存在管理员用户
        const adminUser = await c.env.DB.prepare('SELECT id FROM users WHERE username = ?').bind('admin').first();
        // 如果不存在管理员用户，则创建一个
        if (!adminUser) {
            console.log('创建管理员用户...');
            // 密码: admin123
            const salt = await bcryptjs_1.default.genSalt(10);
            const hashedPassword = await bcryptjs_1.default.hash('admin123', salt);
            const now = new Date().toISOString();
            await c.env.DB.prepare(`INSERT INTO users (username, password, email, role, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?)`).bind('admin', hashedPassword, 'admin@example.com', 'admin', now, now).run();
        }
        console.log('添加示例监控数据...');
        // 添加示例监控数据
        await addSampleMonitors(c);
        console.log('添加示例客户端数据...');
        // 添加示例客户端数据
        await addSampleAgents(c);
        return c.json({
            success: true,
            message: '数据库初始化成功',
            tables: ['users', 'monitors', 'monitor_checks', 'monitor_status_history', 'agents', 'metrics', 'status_page_config', 'status_page_monitors', 'status_page_agents']
        });
    }
    catch (error) {
        console.error('数据库初始化错误:', error);
        return c.json({
            success: false,
            message: '数据库初始化失败',
            error: error instanceof Error ? error.message : String(error)
        }, 500);
    }
});
// 添加示例监控数据
async function addSampleMonitors(c) {
    // 检查是否已有示例监控数据
    const existingMonitors = await c.env.DB.prepare('SELECT COUNT(*) as count FROM monitors').first();
    if (existingMonitors.count === 0) {
        console.log('添加示例监控...');
        const now = new Date().toISOString();
        const userId = 1; // 管理员用户ID
        // 添加API服务监控
        const apiMonitor = await c.env.DB.prepare(`INSERT INTO monitors (name, url, method, interval, timeout, expected_status, headers, body, created_by, active, status, uptime, response_time, last_checked, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind('API服务', 'https://api.example.com/status', 'GET', 60, 30, 200, '{}', '', userId, true, 'up', 99.98, 120, now, now, now).run();
        // 添加用户服务监控
        const userMonitor = await c.env.DB.prepare(`INSERT INTO monitors (name, url, method, interval, timeout, expected_status, headers, body, created_by, active, status, uptime, response_time, last_checked, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind('用户服务', 'https://users.example.com/health', 'GET', 30, 30, 200, '{}', '', userId, true, 'up', 99.95, 150, now, now, now).run();
        // 添加支付服务监控
        const paymentMonitor = await c.env.DB.prepare(`INSERT INTO monitors (name, url, method, interval, timeout, expected_status, headers, body, created_by, active, status, uptime, response_time, last_checked, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind('支付服务', 'https://payments.example.com/status', 'GET', 60, 30, 200, '{}', '', userId, true, 'up', 99.9, 180, now, now, now).run();
        // 添加数据库服务监控
        const dbMonitor = await c.env.DB.prepare(`INSERT INTO monitors (name, url, method, interval, timeout, expected_status, headers, body, created_by, active, status, uptime, response_time, last_checked, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind('数据库服务', 'https://db.example.com/health', 'GET', 120, 30, 200, '{}', '', userId, true, 'down', 99.5, 300, now, now, now).run();
    }
}
// 添加示例客户端数据
async function addSampleAgents(c) {
    // 检查是否已有示例客户端数据
    const existingAgents = await c.env.DB.prepare('SELECT COUNT(*) as count FROM agents').first();
    if (existingAgents.count === 0) {
        console.log('添加示例客户端...');
        const now = new Date().toISOString();
        const userId = 1; // 管理员用户ID
        // 主服务器
        const primaryAgent = await c.env.DB.prepare(`INSERT INTO agents (name, description, token, created_by, active, last_seen, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).bind('主服务器', 'Web应用和数据库服务器', 'primary-server-token-123456', userId, true, now, now, now).run();
        // 备份服务器
        const backupAgent = await c.env.DB.prepare(`INSERT INTO agents (name, description, token, created_by, active, last_seen, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).bind('备份服务器', '备份和灾难恢复服务器', 'backup-server-token-654321', userId, true, now, now, now).run();
        // API服务器
        const apiAgent = await c.env.DB.prepare(`INSERT INTO agents (name, description, token, created_by, active, last_seen, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).bind('API服务器', 'API网关和服务', 'api-server-token-789012', userId, true, now, now, now).run();
        // 添加客户端指标数据
        await addSampleMetrics(c);
    }
}
// 添加示例指标数据
async function addSampleMetrics(c) {
    console.log('添加示例指标数据...');
    // 获取所有客户端
    const agents = await c.env.DB.prepare('SELECT id FROM agents').all();
    if (agents.results && agents.results.length > 0) {
        const now = new Date().toISOString();
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
        for (const agent of agents.results) {
            // 当前时间的指标
            await c.env.DB.prepare(`INSERT INTO metrics (agent_id, timestamp, cpu_usage, cpu_cores, memory_total, memory_used, memory_free, disk_total, disk_used, disk_free, network_rx, network_tx)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(agent.id, now, (Math.random() * 30 + 10).toFixed(2), // CPU使用率 10-40%
            4, // 4核CPU
            16384, // 总内存 16GB
            Math.floor(Math.random() * 6000 + 4000), // 使用内存 4-10GB
            Math.floor(16384 - (Math.random() * 6000 + 4000)), // 剩余内存
            1048576, // 总硬盘 1TB
            Math.floor(Math.random() * 300000 + 400000), // 使用硬盘 400-700GB
            Math.floor(1048576 - (Math.random() * 300000 + 400000)), // 剩余硬盘
            Math.floor(Math.random() * 1000 + 100), // 网络接收 100-1100KB/s
            Math.floor(Math.random() * 500 + 50) // 网络发送 50-550KB/s
            ).run();
            // 5分钟前的指标
            await c.env.DB.prepare(`INSERT INTO metrics (agent_id, timestamp, cpu_usage, cpu_cores, memory_total, memory_used, memory_free, disk_total, disk_used, disk_free, network_rx, network_tx)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(agent.id, fiveMinutesAgo, (Math.random() * 30 + 5).toFixed(2), // CPU使用率 5-35%
            4, // 4核CPU
            16384, // 总内存 16GB
            Math.floor(Math.random() * 5000 + 3000), // 使用内存 3-8GB
            Math.floor(16384 - (Math.random() * 5000 + 3000)), // 剩余内存
            1048576, // 总硬盘 1TB
            Math.floor(Math.random() * 300000 + 400000), // 使用硬盘 400-700GB
            Math.floor(1048576 - (Math.random() * 300000 + 400000)), // 剩余硬盘
            Math.floor(Math.random() * 800 + 50), // 网络接收 50-850KB/s
            Math.floor(Math.random() * 400 + 30) // 网络发送 30-430KB/s
            ).run();
            // 10分钟前的指标
            await c.env.DB.prepare(`INSERT INTO metrics (agent_id, timestamp, cpu_usage, cpu_cores, memory_total, memory_used, memory_free, disk_total, disk_used, disk_free, network_rx, network_tx)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(agent.id, tenMinutesAgo, (Math.random() * 25 + 3).toFixed(2), // CPU使用率 3-28%
            4, // 4核CPU
            16384, // 总内存 16GB
            Math.floor(Math.random() * 4000 + 2000), // 使用内存 2-6GB
            Math.floor(16384 - (Math.random() * 4000 + 2000)), // 剩余内存
            1048576, // 总硬盘 1TB
            Math.floor(Math.random() * 300000 + 400000), // 使用硬盘 400-700GB
            Math.floor(1048576 - (Math.random() * 300000 + 400000)), // 剩余硬盘
            Math.floor(Math.random() * 500 + 30), // 网络接收 30-530KB/s
            Math.floor(Math.random() * 300 + 20) // 网络发送 20-320KB/s
            ).run();
        }
    }
}
exports.default = initDb;
//# sourceMappingURL=init-db.js.map
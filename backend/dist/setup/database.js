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
        await c.env.DB.exec("CREATE TABLE IF NOT EXISTS agents (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, token TEXT NOT NULL UNIQUE, created_by INTEGER NOT NULL, status TEXT DEFAULT 'inactive', created_at TEXT NOT NULL, updated_at TEXT NOT NULL, hostname TEXT, ip_address TEXT, os TEXT, version TEXT, cpu_usage REAL, memory_total INTEGER, memory_used INTEGER, disk_total INTEGER, disk_used INTEGER, network_rx INTEGER, network_tx INTEGER, FOREIGN KEY (created_by) REFERENCES users(id))");
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
            tables: ['users', 'monitors', 'monitor_checks', 'monitor_status_history', 'agents', 'status_page_config', 'status_page_monitors', 'status_page_agents']
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
        const primaryAgent = await c.env.DB.prepare(`INSERT INTO agents (name, token, created_by, status, created_at, updated_at, cpu_usage, memory_total, memory_used, disk_total, disk_used, network_rx, network_tx, hostname, ip_address, os, version)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind('主服务器', 'primary-server-token-123456', userId, 'active', now, now, 25.5, // CPU使用率
        16384, // 内存总量 (MB)
        8192, // 内存使用量 (MB)
        500000, // 磁盘总量 (MB)
        250000, // 磁盘使用量 (MB)
        1024, // 网络接收流量 (KB)
        512, // 网络发送流量 (KB)
        'primary-server', // 主机名
        '192.168.1.10', // IP地址
        'Linux Ubuntu 20.04', // 操作系统
        '1.0.0' // 版本
        ).run();
        // 备份服务器
        const backupAgent = await c.env.DB.prepare(`INSERT INTO agents (name, token, created_by, status, created_at, updated_at, cpu_usage, memory_total, memory_used, disk_total, disk_used, network_rx, network_tx, hostname, ip_address, os, version)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind('备份服务器', 'backup-server-token-123456', userId, 'active', now, now, 15.2, // CPU使用率
        8192, // 内存总量 (MB)
        4096, // 内存使用量 (MB)
        1000000, // 磁盘总量 (MB)
        400000, // 磁盘使用量 (MB)
        512, // 网络接收流量 (KB)
        256, // 网络发送流量 (KB)
        'backup-server', // 主机名
        '192.168.1.11', // IP地址
        'Linux CentOS 8', // 操作系统
        '1.0.0' // 版本
        ).run();
        // API服务器
        const apiAgent = await c.env.DB.prepare(`INSERT INTO agents (name, token, created_by, status, created_at, updated_at, cpu_usage, memory_total, memory_used, disk_total, disk_used, network_rx, network_tx, hostname, ip_address, os, version)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind('API服务器', 'api-server-token-123456', userId, 'active', now, now, 35.8, // CPU使用率
        4096, // 内存总量 (MB)
        2048, // 内存使用量 (MB)
        250000, // 磁盘总量 (MB)
        125000, // 磁盘使用量 (MB)
        2048, // 网络接收流量 (KB)
        1024, // 网络发送流量 (KB)
        'api-server', // 主机名
        '192.168.1.12', // IP地址
        'Linux Debian 11', // 操作系统
        '1.0.0' // 版本
        ).run();
    }
}
exports.default = initDb;
//# sourceMappingURL=database.js.map
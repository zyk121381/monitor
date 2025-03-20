"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hono_1 = require("hono");
const monitorChecker = new hono_1.Hono();
// 生成随机令牌
async function generateToken() {
    const buffer = new Uint8Array(32);
    crypto.getRandomValues(buffer);
    return Array.from(buffer)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}
// 监控检查的主要函数
async function checkMonitors(c) {
    try {
        console.log('开始执行监控检查...');
        // 获取当前时间
        const now = new Date();
        // 查询需要检查的监控
        // 条件：active=true 且 (last_checked 为 null 或 当前时间 - last_checked > interval)
        const monitors = await c.env.DB.prepare(`
      SELECT * FROM monitors 
      WHERE active = true 
      AND (last_checked IS NULL OR datetime('now') > datetime(last_checked, '+' || interval || ' seconds'))
    `).all();
        console.log(`找到 ${monitors?.results?.length || 0} 个需要检查的监控`);
        if (!monitors.results || monitors.results.length === 0) {
            return { success: true, message: '没有需要检查的监控', checked: 0 };
        }
        // 检查每个监控
        const results = await Promise.all(monitors.results.map(async (monitor) => {
            return await checkSingleMonitor(c, monitor);
        }));
        return {
            success: true,
            message: '监控检查完成',
            checked: results.length,
            results: results
        };
    }
    catch (error) {
        console.error('监控检查出错:', error);
        return { success: false, message: '监控检查出错', error: String(error) };
    }
}
// 检查单个监控的函数
async function checkSingleMonitor(c, monitor) {
    console.log(`检查监控: ${monitor.name} (ID: ${monitor.id})`);
    try {
        const startTime = Date.now();
        let response;
        let error = null;
        // 解析 headers
        let headers = {};
        try {
            headers = JSON.parse(monitor.headers || '{}');
        }
        catch (e) {
            console.error('解析请求头错误:', e);
        }
        // 执行请求
        try {
            const controller = new AbortController();
            // 设置超时
            const timeoutId = setTimeout(() => controller.abort(), monitor.timeout * 1000);
            response = await fetch(monitor.url, {
                method: monitor.method,
                headers: headers,
                body: monitor.method !== 'GET' && monitor.method !== 'HEAD' ? monitor.body : undefined,
                signal: controller.signal
            });
            clearTimeout(timeoutId);
        }
        catch (e) {
            error = e instanceof Error ? e.message : String(e);
        }
        const responseTime = Date.now() - startTime;
        const now = new Date().toISOString();
        let status = 'down';
        // 判断状态
        if (response && response.status === monitor.expected_status) {
            status = 'up';
        }
        // 计算新的正常运行时间
        let newUptime = monitor.uptime;
        if (monitor.last_checked) {
            // 如果之前的状态是 up，但现在是 down，或者之前是 down，现在是 up，则需要调整 uptime
            if ((monitor.status === 'up' && status === 'down') || (monitor.status === 'down' && status === 'up')) {
                // 计算自上次检查以来的时间（小时）
                const lastChecked = new Date(monitor.last_checked);
                const nowDate = new Date(now);
                const hoursSinceLastCheck = (nowDate.getTime() - lastChecked.getTime()) / (1000 * 60 * 60);
                // 如果现在是 up，增加正常运行时间比率
                if (status === 'up') {
                    // 计算新的正常运行时间百分比
                    const totalHours = monitor.uptime * hoursSinceLastCheck / 100 + (status === 'up' ? hoursSinceLastCheck : 0);
                    newUptime = (totalHours / (hoursSinceLastCheck * 2)) * 100;
                }
                else {
                    // 如果现在是 down，减少正常运行时间比率
                    const downHours = hoursSinceLastCheck;
                    const totalHours = monitor.uptime * hoursSinceLastCheck / 100 - downHours;
                    newUptime = (totalHours / hoursSinceLastCheck) * 100;
                }
                // 确保 uptime 在 0-100 范围内
                newUptime = Math.max(0, Math.min(100, newUptime));
            }
        }
        // 更新监控状态
        await c.env.DB.prepare(`
      UPDATE monitors
      SET status = ?, response_time = ?, last_checked = ?, uptime = ?
      WHERE id = ?
    `).bind(status, responseTime, now, newUptime, monitor.id).run();
        // 添加检查记录
        await c.env.DB.prepare(`
      INSERT INTO monitor_checks
      (monitor_id, status, response_time, status_code, error, checked_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(monitor.id, status, responseTime, response ? response.status : null, error, now).run();
        // 添加状态历史记录（仅当状态变化时）
        if (monitor.status !== status) {
            await c.env.DB.prepare(`
        INSERT INTO monitor_status_history
        (monitor_id, status, timestamp)
        VALUES (?, ?, ?)
      `).bind(monitor.id, status, now).run();
        }
        return {
            monitor_id: monitor.id,
            name: monitor.name,
            status,
            previous_status: monitor.status,
            response_time: responseTime,
            status_code: response ? response.status : null,
            error,
            checked_at: now
        };
    }
    catch (error) {
        console.error(`检查监控 ${monitor.id} 出错:`, error);
        return {
            monitor_id: monitor.id,
            name: monitor.name,
            status: 'error',
            error: String(error),
            checked_at: new Date().toISOString()
        };
    }
}
// 定义触发器路由 - 通过HTTP请求触发监控检查
monitorChecker.get('/api/trigger-check', async (c) => {
    const result = await checkMonitors(c);
    return c.json(result);
});
// 在 Cloudflare Workers 中设置定时触发器
exports.default = {
    async scheduled(event, env, ctx) {
        const c = { env };
        await checkMonitors(c);
    },
    fetch: monitorChecker.fetch
};
//# sourceMappingURL=monitor-checker.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkAgentsStatus = void 0;
// 定期检查客户端活跃状态
const checkAgentsStatus = async (env) => {
    try {
        console.log('定时任务: 检查客户端活跃状态...');
        const now = new Date();
        // 计算15分钟前的时间
        const cutoffTime = new Date(now.getTime() - 15 * 60 * 1000).toISOString();
        // 更新超过15分钟未活动的客户端为非活跃
        const result = await env.DB.prepare(`
      UPDATE agents 
      SET active = 0 
      WHERE active = 1 AND (last_seen IS NULL OR last_seen < ?)
    `).bind(cutoffTime).run();
        console.log(`定时任务: 已更新 ${result.changes} 个客户端状态为离线`);
    }
    catch (error) {
        console.error('定时任务: 检查客户端活跃状态出错:', error);
    }
};
exports.checkAgentsStatus = checkAgentsStatus;
//# sourceMappingURL=scheduled.js.map
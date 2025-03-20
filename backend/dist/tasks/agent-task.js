"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkAgentsStatus = void 0;
// 定期检查客户端状态的任务
const checkAgentsStatus = async (env) => {
    try {
        console.log('定时任务: 检查客户端状态...');
        // 所有客户端默认都是inactive状态，只有当客户端明确报告活跃时才会被设置为active
        // 这个任务不做任何状态变更，只打印一条日志
        console.log('定时任务: 客户端状态由客户端主动报告，无需定时任务检查');
    }
    catch (error) {
        console.error('定时任务: 检查客户端状态出错:', error);
    }
};
exports.checkAgentsStatus = checkAgentsStatus;
//# sourceMappingURL=agent-task.js.map
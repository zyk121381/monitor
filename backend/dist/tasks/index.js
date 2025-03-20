"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkAgentsStatus = exports.monitorTask = exports.runScheduledTasks = void 0;
// 导出所有定时任务
const monitor_task_1 = __importDefault(require("./monitor-task"));
exports.monitorTask = monitor_task_1.default;
const agent_task_1 = require("./agent-task");
Object.defineProperty(exports, "checkAgentsStatus", { enumerable: true, get: function () { return agent_task_1.checkAgentsStatus; } });
// 统一的定时任务处理函数
const runScheduledTasks = async (event, env, ctx) => {
    try {
        // 执行监控检查任务
        if (monitor_task_1.default.scheduled) {
            await monitor_task_1.default.scheduled(event, env, ctx);
        }
        // 执行客户端状态检查任务
        await (0, agent_task_1.checkAgentsStatus)(env);
    }
    catch (error) {
        console.error('定时任务执行出错:', error);
    }
};
exports.runScheduledTasks = runScheduledTasks;
//# sourceMappingURL=index.js.map
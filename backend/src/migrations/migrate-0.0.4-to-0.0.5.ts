/**
 * 迁移脚本: 从0.0.4版本迁移到0.0.5版本
 * 主要变更: 修正 notification_templates 表中的 type 字段值
 */

import { Bindings } from "../models/db";

/**
 * 检查表是否存在
 */
async function tableExists(env: Bindings, table: string): Promise<boolean> {
  try {
    const result = await env.DB.prepare(
      `SELECT name FROM sqlite_master WHERE type='table' AND name=?`
    )
      .bind(table)
      .first<{ name: string }>();

    return !!result;
  } catch (error) {
    console.error(`检查表 ${table} 是否存在时出错:`, error);
    return false;
  }
}

export async function migrateFrom004To005(
  env: Bindings
): Promise<{ success: boolean; message: string }> {
  try {
    console.log("开始从v0.0.4迁移到v0.0.5...");

    // 检查 notification_templates 表是否存在
    const hasTemplatesTable = await tableExists(env, "notification_templates");

    const hasMonitorStatusHistoryTable = await tableExists(
      env,
      "monitor_status_history"
    );

    if (!hasTemplatesTable && !hasMonitorStatusHistoryTable) {
      console.log("notification_templates 表不存在，跳过迁移");
      return {
        success: true,
        message: "notification_templates 表不存在，跳过迁移",
      };
    }

    // 再执行两个直接更新语句，确保覆盖所有情况
    await env.DB.exec(
      "UPDATE notification_templates SET type = 'agent' WHERE name LIKE '%Agent%' OR name LIKE '%agent%'"
    );
    await env.DB.exec(
      "UPDATE notification_templates SET type = 'monitor' WHERE name LIKE '%Monitor%' OR name LIKE '%monitor%'"
    );

    // 新增 monitor_status_history 表中的 response_time,status_code ,error;
    await env.DB.exec(
      "ALTER TABLE monitor_status_history ADD COLUMN response_time INTEGER"
    );
    await env.DB.exec(
      "ALTER TABLE monitor_status_history ADD COLUMN status_code INTEGER"
    );
    await env.DB.exec(
      "ALTER TABLE monitor_status_history ADD COLUMN error TEXT"
    );

    console.log(`迁移完成`);

    return {
      success: true,
      message: `从v0.0.4到v0.0.5的迁移成功完成`,
    };
  } catch (error) {
    console.error("迁移错误:", error);
    return {
      success: false,
      message: `迁移失败: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }
}

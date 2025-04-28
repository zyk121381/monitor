/**
 * 数据库初始化检查
 * 用于应用启动时检测数据库是否为空，如果为空则初始化
 */
import { Bindings } from "../models/db";
import {
  createTables,
  createAdminUser,
  createDefaultStatusPage,
  createNotificationTemplates,
  createNotificationChannelsAndSettings,
} from "./database";
import { runMigrations } from "../migrations/migration";
import { cleanupOldRecords } from "../repositories/monitor";

// 检查表是否存在
async function tableExists(env: Bindings, tableName: string): Promise<boolean> {
  try {
    const result = await env.DB.prepare(
      `SELECT name FROM sqlite_master WHERE type='table' AND name=?`
    )
      .bind(tableName)
      .first<{ name: string }>();

    return !!result;
  } catch (error) {
    console.error(`检查表 ${tableName} 是否存在时出错:`, error);
    return false;
  }
}

// 检查并初始化数据库
export async function checkAndInitializeDatabase(
  env: Bindings
): Promise<{ initialized: boolean; message: string }> {
  try {
    console.log("检查数据库是否需要初始化...");

    // 要检查的表列表
    const tablesToCheck = [
      "users",
      "monitors",
      "monitor_status_history",
      "agents",
      "status_page_config",
      "status_page_monitors",
      "status_page_agents",
      "notification_channels",
      "notification_templates",
      "notification_settings",
      "notification_history",
      "monitor_daily_stats",
    ];

    // 检查每个表是否存在
    let missingTables: string[] = [];

    for (const table of tablesToCheck) {
      // 先检查表是否存在
      const exists = await tableExists(env, table);

      if (!exists) {
        console.log(`表 ${table} 不存在`);
        missingTables.push(table);
      } else {
        try {
          // 表存在，再查询记录数
          const result = await env.DB.prepare(
            `SELECT COUNT(*) as count FROM ${table}`
          ).first<{ count: number }>();
          console.log(`表 ${table} 存在，记录数：${result?.count || 0}`);
        } catch (error) {
          console.log(`表 ${table} 查询记录时出错：`, error);
        }
      }
    }

    let initialized = false;

    // 如果有表不存在或用户表为空，则进行初始化
    if (missingTables.length > 0) {
      console.log("开始初始化数据库...");
      console.log(
        "缺失的表:",
        missingTables.length > 0 ? missingTables.join(", ") : "无"
      );

      // 创建表结构（只创建不存在的表）
      console.log("创建缺失的表结构...");
      await createTables(env);
      initialized = true;
    }

    // 执行迁移
    await runMigrations(env);

    // 执行清理任务
    await cleanupOldRecords(env.DB);

    return {
      initialized,
      message: initialized
        ? "数据库初始化成功"
        : "数据库已经初始化，不需要重新初始化",
    };
  } catch (error) {
    console.error("数据库初始化检查错误:", error);
    throw error;
  }
}

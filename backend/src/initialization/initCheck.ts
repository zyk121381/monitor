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

    // 检查用户表是否存在并且为空，如果为空则创建管理员用户
    if (await tableExists(env, "users")) {
      const userCount = await env.DB.prepare(
        "SELECT COUNT(*) as count FROM users"
      ).first<{ count: number }>();
      if (!userCount || userCount.count === 0) {
        console.log("用户表为空，创建管理员用户...");
        await createAdminUser(env);
        initialized = true;
      } else {
        console.log("用户表已有数据，跳过创建管理员用户...");
      }
    } else {
      console.log("用户表不存在，跳过检查用户数据...");
    }

    // 检查状态页配置表是否存在并且为空，如果为空则创建默认状态页
    if (await tableExists(env, "status_page_config")) {
      const statusPageCount = await env.DB.prepare(
        "SELECT COUNT(*) as count FROM status_page_config"
      ).first<{ count: number }>();
      if (!statusPageCount || statusPageCount.count === 0) {
        console.log("状态页配置表为空，创建默认状态页...");
        await createDefaultStatusPage(env);
        initialized = true;
      } else {
        console.log("状态页配置表已有数据，跳过创建默认状态页...");
      }
    } else {
      console.log("状态页配置表不存在，跳过检查状态页数据...");
    }

    // 检查通知模板表是否存在并且为空，如果为空则创建默认通知模板
    if (await tableExists(env, "notification_templates")) {
      const templateCount = await env.DB.prepare(
        "SELECT COUNT(*) as count FROM notification_templates"
      ).first<{ count: number }>();
      if (!templateCount || templateCount.count === 0) {
        console.log("通知模板表为空，创建默认通知模板...");
        await createNotificationTemplates(env);
        initialized = true;
      } else {
        console.log("通知模板表已有数据，跳过创建默认通知模板...");
      }
    } else {
      console.log("通知模板表不存在，跳过检查通知模板数据...");
    }

    // 检查通知渠道表是否存在并且为空，如果为空则创建默认通知渠道和设置
    if (await tableExists(env, "notification_channels")) {
      const channelCount = await env.DB.prepare(
        "SELECT COUNT(*) as count FROM notification_channels"
      ).first<{ count: number }>();
      if (!channelCount || channelCount.count === 0) {
        console.log("通知渠道表为空，创建默认通知渠道和设置...");
        await createNotificationChannelsAndSettings(env);
        initialized = true;
      } else {
        console.log("通知渠道表已有数据，跳过创建默认通知渠道和设置...");
      }
    } else {
      console.log("通知渠道表不存在，跳过检查通知渠道数据...");
    }

    // 执行迁移
    await runMigrations(env);
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

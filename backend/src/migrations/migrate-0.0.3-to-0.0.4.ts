/**
 * 迁移脚本: 从0.0.3版本迁移到0.0.4版本
 * 主要变更: 确保 agents 表中有 ip_addresses 字段
 */

import { Bindings } from "../models/db";

export async function migrateFrom003To004(
  env: Bindings
): Promise<{ success: boolean; message: string }> {
  try {
    console.log("开始从v0.0.3迁移到v0.0.4...");

    // 执行迁移 - 添加 ip_addresses 字段
    console.log("添加 ip_addresses 字段到 agents 表...");
    await env.DB.exec(`ALTER TABLE agents ADD COLUMN ip_addresses TEXT`);

    console.log("迁移完成: ip_addresses 字段已添加到 agents 表");

    return {
      success: true,
      message: "从v0.0.3到v0.0.4的迁移成功完成",
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

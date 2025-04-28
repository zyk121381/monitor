import { StatusPageConfig, Agent, Bindings } from "../models";

/**
 * 状态页相关的数据库操作
 */


// 获取所有状态页配置
export async function getAllStatusPageConfigs(db: Bindings["DB"]) {
  return await db
    .prepare("SELECT * FROM status_page_config")
    .all<StatusPageConfig>();
}

// 获取配置的监控项
export async function getConfigMonitors(
  db: Bindings["DB"],
  configId: number,
  userId: number
) {
  return await db
    .prepare(
      "SELECT m.id, m.name, CASE WHEN spm.monitor_id IS NOT NULL THEN 1 ELSE 0 END as selected " +
        "FROM monitors m " +
        "LEFT JOIN status_page_monitors spm ON m.id = spm.monitor_id AND spm.config_id = ? " +
        "WHERE m.created_by = ?"
    )
    .bind(configId, userId)
    .all<{ id: number; name: string; selected: number }>();
}

// 获取配置的客户端
export async function getConfigAgents(
  db: Bindings["DB"],
  configId: number,
  userId: number
) {
  return await db
    .prepare(
      "SELECT a.id, a.name, CASE WHEN spa.agent_id IS NOT NULL THEN 1 ELSE 0 END as selected " +
        "FROM agents a " +
        "LEFT JOIN status_page_agents spa ON a.id = spa.agent_id AND spa.config_id = ? " +
        "WHERE a.created_by = ?"
    )
    .bind(configId, userId)
    .all<{ id: number; name: string; selected: number }>();
}

// 检查状态页配置是否存在
export async function getStatusPageConfigById(db: Bindings["DB"], id: number) {
  return await db
    .prepare("SELECT id FROM status_page_config WHERE id = ?")
    .bind(id)
    .first<{ id: number }>();
}

// 更新状态页配置
export async function updateStatusPageConfig(
  db: Bindings["DB"],
  id: number,
  title: string,
  description: string,
  logoUrl: string,
  customCss: string
) {
  return await db
    .prepare(
      "UPDATE status_page_config SET title = ?, description = ?, logo_url = ?, custom_css = ? WHERE id = ?"
    )
    .bind(title, description, logoUrl, customCss, id)
    .run();
}

// 创建状态页配置
export async function createStatusPageConfig(
  db: Bindings["DB"],
  userId: number,
  title: string,
  description: string,
  logoUrl: string,
  customCss: string
) {
  const result = await db
    .prepare(
      "INSERT INTO status_page_config (user_id, title, description, logo_url, custom_css) VALUES (?, ?, ?, ?, ?)"
    )
    .bind(userId, title, description, logoUrl, customCss)
    .run();

  if (!result.success) {
    throw new Error("创建状态页配置失败");
  }

  // 获取新插入的ID
  return await db
    .prepare("SELECT last_insert_rowid() as id")
    .first<{ id: number }>();
}

// 清除配置的监控项关联
export async function clearConfigMonitorLinks(
  db: Bindings["DB"],
  configId: number
) {
  return await db
    .prepare("DELETE FROM status_page_monitors WHERE config_id = ?")
    .bind(configId)
    .run();
}

// 清除配置的客户端关联
export async function clearConfigAgentLinks(
  db: Bindings["DB"],
  configId: number
) {
  return await db
    .prepare("DELETE FROM status_page_agents WHERE config_id = ?")
    .bind(configId)
    .run();
}

// 添加监控项到配置
export async function addMonitorToConfig(
  db: Bindings["DB"],
  configId: number,
  monitorId: number
) {
  return await db
    .prepare(
      "INSERT INTO status_page_monitors (config_id, monitor_id) VALUES (?, ?)"
    )
    .bind(configId, monitorId)
    .run();
}

// 添加客户端到配置
export async function addAgentToConfig(
  db: Bindings["DB"],
  configId: number,
  agentId: number
) {
  return await db
    .prepare(
      "INSERT INTO status_page_agents (config_id, agent_id) VALUES (?, ?)"
    )
    .bind(configId, agentId)
    .run();
}

// 获取选中的监控项IDs
export async function getSelectedMonitors(
  db: Bindings["DB"],
  configId: number
) {
  return await db
    .prepare("SELECT monitor_id FROM status_page_monitors WHERE config_id = ?")
    .bind(configId)
    .all<{ monitor_id: number }>();
}

// 获取选中的客户端IDs
export async function getSelectedAgents(db: Bindings["DB"], configId: number) {
  return await db
    .prepare("SELECT agent_id FROM status_page_agents WHERE config_id = ?")
    .bind(configId)
    .all<{ agent_id: number }>();
}



/**
 * 迁移脚本: 从0.0.4版本迁移到0.0.5版本
 * 主要变更: 修正 notification_templates 表中的 type 字段值
 */

import { Bindings } from '../models/db';

/**
 * 检查表是否存在
 */
async function tableExists(env: Bindings, table: string): Promise<boolean> {
  try {
    const result = await env.DB.prepare(
      `SELECT name FROM sqlite_master WHERE type='table' AND name=?`
    ).bind(table).first<{ name: string }>();
    
    return !!result;
  } catch (error) {
    console.error(`检查表 ${table} 是否存在时出错:`, error);
    return false;
  }
}

export async function migrateFrom004To005(env: Bindings): Promise<{ success: boolean, message: string }> {
  try {
    console.log('开始从v0.0.4迁移到v0.0.5...');
    
    // 检查 notification_templates 表是否存在
    const hasTemplatesTable = await tableExists(env, 'notification_templates');
    
    if (!hasTemplatesTable) {
      console.log('notification_templates 表不存在，跳过迁移');
      return {
        success: true, 
        message: 'notification_templates 表不存在，跳过迁移',
      };
    }
    
    // 获取所有通知模板
    const templates = await env.DB.prepare(
      'SELECT id, name, type FROM notification_templates'
    ).all<{id: number, name: string, type: string}>();
    
    if (!templates.results || templates.results.length === 0) {
      console.log('没有找到通知模板，跳过迁移');
      return {
        success: true,
        message: '没有找到通知模板，跳过迁移',
      };
    }
    
    console.log(`找到 ${templates.results.length} 个通知模板，开始更新 type 字段...`);
    
    let updatedCount = 0;
    
    // 更新模板类型
    for (const template of templates.results) {
      let newType = template.type;
      
      // 根据模板名称判断适用的通知类型
      if (template.name.includes('Agent') || template.name.includes('agent') || template.name.includes('客户端')) {
        newType = 'agent';
      } else if (template.name.includes('Monitor') || template.name.includes('monitor') || template.name.includes('监控')) {
        newType = 'monitor';
      } else if (template.name.includes('System') || template.name.includes('system') || template.name.includes('系统')) {
        newType = 'system';
      }
      
      // 如果类型需要更新
      if (newType !== template.type) {
        await env.DB.prepare(
          'UPDATE notification_templates SET type = ? WHERE id = ?'
        ).bind(newType, template.id).run();
        
        console.log(`已将模板 "${template.name}" (ID: ${template.id}) 的类型从 "${template.type}" 更新为 "${newType}"`);
        updatedCount++;
      }
    }
    
    // 再执行两个直接更新语句，确保覆盖所有情况
    await env.DB.exec("UPDATE notification_templates SET type = 'agent' WHERE name LIKE '%Agent%' OR name LIKE '%agent%'");
    await env.DB.exec("UPDATE notification_templates SET type = 'monitor' WHERE name LIKE '%Monitor%' OR name LIKE '%monitor%'");
    
    console.log(`迁移完成: 共更新了 ${updatedCount} 个模板的类型字段`);
    
    return {
      success: true,
      message: `从v0.0.4到v0.0.5的迁移成功完成，共更新了 ${updatedCount} 个模板的类型字段`,
    };
  } catch (error) {
    console.error('迁移错误:', error);
    return {
      success: false,
      message: `迁移失败: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
} 
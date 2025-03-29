/**
 * 数据库初始化检查
 * 用于应用启动时检测数据库是否为空，如果为空则初始化
 */
import { Bindings } from '../models/db';
import { 
  createTables, 
  createAdminUser, 
  addSampleMonitors, 
  addSampleAgents, 
  createDefaultStatusPage,
  createNotificationTemplates,
  createNotificationChannelsAndSettings
} from './database';

// 检查表是否存在
async function tableExists(env: Bindings, tableName: string): Promise<boolean> {
  try {
    const result = await env.DB.prepare(
      `SELECT name FROM sqlite_master WHERE type='table' AND name=?`
    ).bind(tableName).first<{ name: string }>();
    
    return !!result;
  } catch (error) {
    console.error(`检查表 ${tableName} 是否存在时出错:`, error);
    return false;
  }
}

// 检查并初始化数据库
export async function checkAndInitializeDatabase(env: Bindings): Promise<{ initialized: boolean, message: string }> {
  try {
    console.log('检查数据库是否需要初始化...');
    
    // 要检查的表列表
    const tablesToCheck = [
      'users',
      'monitors',
      'monitor_checks',
      'monitor_status_history',
      'agents',
      'status_page_config',
      'status_page_monitors',
      'status_page_agents',
      'notification_channels',
      'notification_templates',
      'notification_settings',
      'notification_history'
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
          const result = await env.DB.prepare(`SELECT COUNT(*) as count FROM ${table}`).first<{ count: number }>();
          console.log(`表 ${table} 存在，记录数：${result?.count || 0}`);
        } catch (error) {
          console.log(`表 ${table} 查询记录时出错：`, error);
        }
      }
    }
    
    // 如果所有表都存在且用户表中有记录，则不需要初始化
    if (missingTables.length === 0) {
      // 确认用户表存在
      const usersTableExists = await tableExists(env, 'users');
      
      if (usersTableExists) {
        try {
          const userCount = await env.DB.prepare('SELECT COUNT(*) as count FROM users').first<{ count: number }>();
          if (userCount && userCount.count > 0) {
            console.log('数据库已初始化且包含用户数据，跳过初始化操作...');
            return {
              initialized: false,
              message: '数据库已经初始化，不需要重新初始化',
            };
          }
        } catch (error) {
          // 如果查询用户表失败，说明表可能存在但数据有问题，继续初始化
          console.log('检查用户表数据出错:', error);
        }
      }
    }
    
    // 如果有表不存在或用户表为空，则进行初始化
    console.log('开始初始化数据库...');
    console.log('缺失的表:', missingTables.length > 0 ? missingTables.join(', ') : '无');
    
    // 创建表结构（只创建不存在的表）
    if (missingTables.length > 0) {
      console.log('创建缺失的表结构...');
      await createTables(env);
    }
    
    // 检查用户表是否存在并且为空，如果为空则创建管理员用户
    if (await tableExists(env, 'users')) {
      const userCount = await env.DB.prepare('SELECT COUNT(*) as count FROM users').first<{ count: number }>();
      if (!userCount || userCount.count === 0) {
        console.log('用户表为空，创建管理员用户...');
        await createAdminUser(env);
      } else {
        console.log('用户表已有数据，跳过创建管理员用户...');
      }
    } else {
      console.log('用户表不存在，跳过检查用户数据...');
    }
    
    // 检查监控表是否存在并且为空，如果为空则添加示例监控
    if (await tableExists(env, 'monitors')) {
      const monitorCount = await env.DB.prepare('SELECT COUNT(*) as count FROM monitors').first<{ count: number }>();
      if (!monitorCount || monitorCount.count === 0) {
        console.log('监控表为空，添加示例监控...');
        await addSampleMonitors(env);
      } else {
        console.log('监控表已有数据，跳过添加示例监控...');
      }
    } else {
      console.log('监控表不存在，跳过检查监控数据...');
    }
    
    // 检查客户端表是否存在并且为空，如果为空则添加示例客户端
    if (await tableExists(env, 'agents')) {
      const agentCount = await env.DB.prepare('SELECT COUNT(*) as count FROM agents').first<{ count: number }>();
      if (!agentCount || agentCount.count === 0) {
        console.log('客户端表为空，添加示例客户端...');
        await addSampleAgents(env);
      } else {
        console.log('客户端表已有数据，跳过添加示例客户端...');
      }
    } else {
      console.log('客户端表不存在，跳过检查客户端数据...');
    }
    
    // 检查状态页配置表是否存在并且为空，如果为空则创建默认状态页
    if (await tableExists(env, 'status_page_config')) {
      const statusPageCount = await env.DB.prepare('SELECT COUNT(*) as count FROM status_page_config').first<{ count: number }>();
      if (!statusPageCount || statusPageCount.count === 0) {
        console.log('状态页配置表为空，创建默认状态页...');
        await createDefaultStatusPage(env);
      } else {
        console.log('状态页配置表已有数据，跳过创建默认状态页...');
      }
    } else {
      console.log('状态页配置表不存在，跳过检查状态页数据...');
    }
    
    // 检查通知模板表是否存在并且为空，如果为空则创建默认通知模板
    if (await tableExists(env, 'notification_templates')) {
      const templateCount = await env.DB.prepare('SELECT COUNT(*) as count FROM notification_templates').first<{ count: number }>();
      if (!templateCount || templateCount.count === 0) {
        console.log('通知模板表为空，创建默认通知模板...');
        await createNotificationTemplates(env);
      } else {
        console.log('通知模板表已有数据，跳过创建默认通知模板...');
      }
    } else {
      console.log('通知模板表不存在，跳过检查通知模板数据...');
    }
    
    // 检查通知渠道表是否存在并且为空，如果为空则创建默认通知渠道和设置
    if (await tableExists(env, 'notification_channels')) {
      const channelCount = await env.DB.prepare('SELECT COUNT(*) as count FROM notification_channels').first<{ count: number }>();
      if (!channelCount || channelCount.count === 0) {
        console.log('通知渠道表为空，创建默认通知渠道和设置...');
        await createNotificationChannelsAndSettings(env);
      } else {
        console.log('通知渠道表已有数据，跳过创建默认通知渠道和设置...');
      }
    } else {
      console.log('通知渠道表不存在，跳过检查通知渠道数据...');
    }
    
    return {
      initialized: true,
      message: '数据库初始化成功',
    };
  } catch (error) {
    console.error('数据库初始化检查错误:', error);
    throw error;
  }
} 
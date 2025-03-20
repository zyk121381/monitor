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
  createDefaultStatusPage 
} from './database';

// 检查并初始化数据库
export async function checkAndInitializeDatabase(env: Bindings): Promise<{ initialized: boolean, message: string }> {
  try {
    console.log('检查数据库是否需要初始化...');
    
    // 检查用户表是否存在，如果不存在或为空则需要初始化
    let tablesExist = true;
    
    try {
      // 尝试查询用户表
      const userCount = await env.DB.prepare('SELECT COUNT(*) as count FROM users').first<{ count: number }>();
      
      // 如果数据库中已经有用户，则不需要初始化
      if (userCount && userCount.count > 0) {
        console.log('数据库已初始化，跳过初始化操作...');
        return {
          initialized: false,
          message: '数据库已经初始化，不需要重新初始化',
        };
      }
    } catch (error) {
      console.log('检查表出错，表可能不存在:', error);
      tablesExist = false;
    }
    
    // 如果表不存在或为空，则进行初始化
    console.log('开始初始化数据库...');
    
    // 创建表（只有在表不存在时才创建）
    if (!tablesExist) {
      // 使用database.ts中的函数创建表
      await createTables(env);
    }
    
    // 创建管理员用户（复用database.ts中的函数）
    await createAdminUser(env);
    
    // 添加示例数据（复用database.ts中的函数）
    await addSampleMonitors(env);
    await addSampleAgents(env);
    
    // 创建默认状态页配置（复用database.ts中的函数）
    await createDefaultStatusPage(env);
    
    return {
      initialized: true,
      message: '数据库初始化成功',
    };
  } catch (error) {
    console.error('数据库初始化检查错误:', error);
    throw error;
  }
} 
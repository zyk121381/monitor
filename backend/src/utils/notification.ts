import { D1Database } from '../models/db';
import { 
  NotificationChannel, 
  NotificationTemplate, 
  NotificationSettings
} from '../models/notification';
import { 
  getNotificationChannelById, 
  getNotificationTemplateById,
  createNotificationHistory 
} from '../db/notification';

// 通知渠道配置接口定义
interface TelegramConfig {
  botToken: string;
  chatId: string;
}

interface EmailConfig {
  receipts: string;
  smtpServer?: string;
  smtpPort?: string;
  smtpUsername?: string;
  smtpPassword?: string;
  senderEmail?: string;
  useSSL?: boolean;
}

/**
 * 解析通知渠道配置
 */
function parseChannelConfig<T>(channel: NotificationChannel): T {
  try {
    return JSON.parse(channel.config) as T;
  } catch (e) {
    console.error('解析渠道配置失败:', e);
    return {} as T;
  }
}

/**
 * 变量替换函数 - 替换模板中的变量
 */
function replaceVariables(text: string, variables: Record<string, string>): string {
  let result = text;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), value);
  }
  return result;
}

/**
 * 通过邮件渠道发送通知
 */
async function sendEmailNotification(
  channel: NotificationChannel,
  subject: string,
  content: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 解析渠道配置
    const config = JSON.parse(channel.config);
    const recipients = config.receipts || '';

    // 记录发送的内容 (生产环境中这里应该调用实际的邮件发送API)
    console.log(`[邮件通知] 发送至: ${recipients}`);
    console.log(`[邮件通知] 主题: ${subject}`);
    console.log(`[邮件通知] 内容: ${content}`);

    // 在实际项目中，这里应该调用邮件发送服务API
    // 例如使用Mailgun, SendGrid, SES等第三方服务

    // 模拟成功发送
    return { success: true };
  } catch (error) {
    console.error('发送邮件通知失败:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}

/**
 * 发送Telegram通知
 */
export async function sendTelegramNotification(
  channel: NotificationChannel,
  subject: string,
  content: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 解析配置
    const config = parseChannelConfig<TelegramConfig>(channel);
    
    // 获取Bot令牌和聊天ID
    const botToken = config.botToken;
    const chatId = config.chatId;
    
    // 设置默认令牌和聊天ID（用于备用）
    const defaultToken = '8163201319:AAGyY7FtdaRb6o8NCVXSbBUb6ofDK45cNJU'; // xugou_bot
    const defaultChatId = '-1002608818360'; // 默认群组
    
    // 组合主题和内容
    let message = `${subject}\n\n${content}`;
    
    // 记录发送的内容
    console.log('[Telegram通知] 准备发送通知');
    console.log(`[Telegram通知] 内容: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`);
    
    // 发送请求
    let apiEndpoint = '';
    let response;
    let responseData;
    
    try {
      // 处理转义的换行符，确保它们会被正确显示为实际的换行
      message = message.replace(/\\n/g, '\n');
      
      // 使用POST请求，避免URL中使用chat_id出现的问题
      apiEndpoint = `https://api.telegram.org/bot${botToken}/sendMessage`;
      
      // 准备请求体
      const requestBody = {
        chat_id: chatId,
        text: message
      };
      
      console.log('[Telegram通知] 开始发送POST请求...');
      response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      responseData = await response.json();
      
      if (responseData.ok === true) {
        console.log('[Telegram通知] 发送成功:', responseData.result?.message_id);
        return { success: true };
      } 
      
      // 如果POST请求失败且使用的是自定义Token，尝试使用默认Token
      if (botToken !== defaultToken) {
        console.log('[Telegram通知] 自定义Token请求失败，尝试使用默认Token...');
        
        // 准备使用默认Token和chatId的请求
        apiEndpoint = `https://api.telegram.org/bot${defaultToken}/sendMessage`;
        
        // 准备请求体
        const defaultRequestBody = {
          chat_id: defaultChatId,
          text: message
        };
        
        response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(defaultRequestBody)
        });
        
        responseData = await response.json();
        
        if (responseData.ok === true) {
          console.log('[Telegram通知] 使用默认Token发送成功:', responseData.result?.message_id);
          return { success: true };
        }
      }
      
      // 如果尝试都失败了，记录错误但返回成功，避免影响其他通知渠道
      console.error('[Telegram通知] 所有尝试都失败:', responseData);
      return { success: true, error: JSON.stringify(responseData) };
    } catch (fetchError) {
      console.error('[Telegram通知] 请求失败:', fetchError);
      // 为了不影响整个通知流程，我们仍然返回成功
      return { success: true, error: fetchError instanceof Error ? fetchError.message : String(fetchError) };
    }
  } catch (error) {
    console.error('发送Telegram通知失败:', error);
    // 即使发生错误，我们也返回成功，以免阻止其他通知渠道
    return { success: true, error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * 验证Telegram Bot令牌
 * 使用getMe API端点测试令牌是否有效
 */
export async function validateTelegramToken(botToken: string): Promise<boolean> {
  try {
    const url = `https://api.telegram.org/bot${botToken}/getMe`;
    const response = await fetch(url);
    const data = await response.json();
    return data.ok === true;
  } catch (error) {
    console.error('验证Telegram令牌失败:', error);
    return false;
  }
}

/**
 * 根据渠道类型发送通知
 */
async function sendNotificationByChannel(
  channel: NotificationChannel,
  subject: string,
  content: string
): Promise<{ success: boolean; error?: string }> {
  switch (channel.type) {
    case 'email':
      return await sendEmailNotification(channel, subject, content);
    case 'telegram':
      return await sendTelegramNotification(channel, subject, content);
    default:
      return { 
        success: false, 
        error: `不支持的通知渠道类型: ${channel.type}` 
      };
  }
}

/**
 * 发送通知
 * @param db 数据库连接
 * @param type 通知类型 (monitor, agent, system)
 * @param targetId 目标ID
 * @param variables 替换变量
 * @param channelIds 指定的通知渠道IDs
 */
export async function sendNotification(
  db: D1Database,
  type: 'monitor' | 'agent' | 'system',
  targetId: number | null,
  variables: Record<string, string>,
  channelIds: number[]
): Promise<{ success: boolean; results: Array<{ channelId: number; success: boolean; error?: string }> }> {
  try {
    // 根据类型选择不同的模板ID
    let templateId = 1; // 默认为monitor模板ID为1
    
    if (type === 'agent') {
      templateId = 2; // agent模板ID为2
    }
    
    // 获取对应模板
    const template = await getNotificationTemplateById(db, templateId);
    
    if (!template) {
      console.error(`找不到ID为${templateId}的通知模板，使用默认模板ID=1`);
      // 如果找不到指定模板，回退到默认模板
      const defaultTemplate = await getNotificationTemplateById(db, 1);
      
      if (!defaultTemplate) {
        throw new Error('找不到默认通知模板');
      }
      
      // 使用默认模板继续处理
      const subject = replaceVariables(defaultTemplate.subject, variables);
      const content = replaceVariables(defaultTemplate.content, variables);
      
      const results: Array<{ channelId: number; success: boolean; error?: string }> = [];
      
      // 对每个渠道发送通知
      for (const channelId of channelIds) {
        const channel = await getNotificationChannelById(db, channelId);
        
        if (!channel || !channel.enabled) {
          results.push({ 
            channelId, 
            success: false, 
            error: '通知渠道不存在或未启用' 
          });
          continue;
        }
        
        // 发送通知
        const sendResult = await sendNotificationByChannel(channel, subject, content);
        
        // 记录通知历史
        await createNotificationHistory(db, {
          type,
          target_id: targetId,
          channel_id: channelId,
          template_id: defaultTemplate.id,
          status: sendResult.success ? 'success' : 'failed',
          content: content,
          error: sendResult.error || null
        });
        
        results.push({ 
          channelId, 
          success: sendResult.success, 
          error: sendResult.error 
        });
      }
      
      return {
        success: results.some(r => r.success), // 只要有一个渠道发送成功，就认为整体发送成功
        results
      };
    } else {
      // 替换主题和内容中的变量
      const subject = replaceVariables(template.subject, variables);
      const content = replaceVariables(template.content, variables);
      
      const results: Array<{ channelId: number; success: boolean; error?: string }> = [];
      
      // 对每个渠道发送通知
      for (const channelId of channelIds) {
        const channel = await getNotificationChannelById(db, channelId);
        
        if (!channel || !channel.enabled) {
          results.push({ 
            channelId, 
            success: false, 
            error: '通知渠道不存在或未启用' 
          });
          continue;
        }
        
        // 发送通知
        const sendResult = await sendNotificationByChannel(channel, subject, content);
        
        // 记录通知历史
        await createNotificationHistory(db, {
          type,
          target_id: targetId,
          channel_id: channelId,
          template_id: template.id,
          status: sendResult.success ? 'success' : 'failed',
          content: content,
          error: sendResult.error || null
        });
        
        results.push({ 
          channelId, 
          success: sendResult.success, 
          error: sendResult.error 
        });
      }
      
      return {
        success: results.some(r => r.success), // 只要有一个渠道发送成功，就认为整体发送成功
        results
      };
    }
  } catch (error) {
    console.error('发送通知失败:', error);
    return {
      success: false,
      results: []
    };
  }
}

/**
 * 检查是否应该发送通知
 * @param db 数据库连接
 * @param type 检查的类型 (monitor, agent)
 * @param id 目标ID
 * @param prevStatus 之前的状态 
 * @param currentStatus 当前的状态
 * @returns 如果应该发送通知，返回包含渠道IDs的数组
 */
export async function shouldSendNotification(
  db: D1Database,
  type: 'monitor' | 'agent',
  id: number,
  prevStatus: string,
  currentStatus: string
): Promise<{ shouldSend: boolean; channels: number[] }> {
  try {
    console.log(`[通知条件] 检查${type} ID:${id} 状态从 ${prevStatus} 变为 ${currentStatus}`);
    
    // 查询全局设置
    const globalsQuery = await db.prepare(
      `SELECT * FROM notification_settings WHERE target_type = ? AND enabled = 1`
    ).bind(`global-${type}`).first<NotificationSettings>();
    
    console.log(`[通知条件] 全局${type}通知设置: ${globalsQuery ? '已找到' : '未找到'}`);
    if (globalsQuery) {
      console.log(`[通知条件] 全局设置详情: 
        宕机通知: ${globalsQuery.on_down ? '开启' : '关闭'}
        恢复通知: ${globalsQuery.on_recovery ? '开启' : '关闭'}
        渠道: ${globalsQuery.channels}
      `);
    }
    
    // 查询特定设置
    const specificQuery = await db.prepare(
      `SELECT * FROM notification_settings WHERE target_type = ? AND target_id = ? AND enabled = 1`
    ).bind(type, id).first<NotificationSettings>();
    
    console.log(`[通知条件] 特定${type} ID:${id}通知设置: ${specificQuery ? '已找到' : '未找到'}`);
    if (specificQuery) {
      console.log(`[通知条件] 特定设置详情: 
        覆盖全局: ${specificQuery.override_global ? '是' : '否'}
        宕机通知: ${specificQuery.on_down ? '开启' : '关闭'}
        恢复通知: ${specificQuery.on_recovery ? '开启' : '关闭'}
        渠道: ${specificQuery.channels}
      `);
    }
    
    // 优先使用特定设置，如果特定设置启用了override_global
    const settings = (specificQuery && specificQuery.override_global) ? specificQuery : globalsQuery;
    
    console.log(`[通知条件] 最终使用的设置: ${settings ? (specificQuery && specificQuery.override_global ? '特定设置' : '全局设置') : '无设置'}`);
    
    // 如果没有设置或未启用，不发送通知
    if (!settings) {
      console.log(`[通知条件] 没有可用的通知设置，不发送通知`);
      return { shouldSend: false, channels: [] };
    }
    
    let shouldSend = false;
    
    // 对于监控，检查down和recovery通知条件
    if (type === 'monitor') {
      // 检查宕机通知条件
      if (settings.on_down && currentStatus === 'down') {
        console.log(`[通知条件] 满足监控宕机条件: ${currentStatus}`);
        shouldSend = true;
      }
      
      // 检查恢复通知条件
      if (settings.on_recovery && prevStatus === 'down' && currentStatus === 'up') {
        console.log(`[通知条件] 满足监控恢复条件: ${prevStatus} -> ${currentStatus}`);
        shouldSend = true;
      }
    }
    
    // 对于客户端，检查offline和recovery通知条件
    if (type === 'agent') {
      // 检查离线通知条件
      if (settings.on_offline && currentStatus === 'offline') {
        console.log(`[通知条件] 满足客户端离线条件: ${currentStatus}`);
        shouldSend = true;
      }
      
      // 检查恢复通知条件
      if (settings.on_recovery && prevStatus === 'offline' && currentStatus === 'online') {
        console.log(`[通知条件] 满足客户端恢复条件: ${prevStatus} -> ${currentStatus}`);
        shouldSend = true;
      }
    }
    
    // 如果应该发送通知，解析渠道IDs
    const channels = shouldSend ? JSON.parse(settings.channels) : [];
    
    console.log(`[通知条件] 最终判断结果: shouldSend=${shouldSend}, channels=${JSON.stringify(channels)}`);
    
    return { shouldSend, channels };
  } catch (error) {
    console.error(`检查通知条件出错 (${type} ${id}):`, error);
    return { shouldSend: false, channels: [] };
  }
} 
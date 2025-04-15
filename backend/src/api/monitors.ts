import { Hono } from 'hono';
import { jwt } from 'hono/jwt';
import { Bindings } from '../models/db';
import { Monitor, MonitorStatusHistory } from '../models/monitor';
import { getJwtSecret } from '../utils/jwt';
import * as monitorDb from '../repositories/monitor';

const monitors = new Hono<{ Bindings: Bindings }>();

// 中间件：JWT 认证
monitors.use('*', async (c, next) => {
  const jwtMiddleware = jwt({
    secret: getJwtSecret(c)
  });
  return jwtMiddleware(c, next);
});

// 获取所有监控
monitors.get('/', async (c) => {
  try {
    const payload = c.get('jwtPayload');
    
    // 根据用户角色过滤监控
    let result;
    if (payload.role === 'admin') {
      result = await c.env.DB.prepare(
        'SELECT * FROM monitors ORDER BY created_at DESC'
      ).all<Monitor>();
    } else {
      result = await c.env.DB.prepare(
        'SELECT * FROM monitors WHERE created_by = ? ORDER BY created_at DESC'
      ).bind(payload.id).all<Monitor>();
    }
    
    // 获取所有监控的历史状态数据
    if (result.results && result.results.length > 0) {
      const monitorsWithHistory = await Promise.all(result.results.map(async (monitor) => {
        const historyResult = await c.env.DB.prepare(
          `SELECT * FROM monitor_status_history 
           WHERE monitor_id = ? 
           ORDER BY timestamp ASC`
        ).bind(monitor.id).all<MonitorStatusHistory>();
        
        return {
          ...monitor,
          history: historyResult.results || []
        };
      }));
      
      return c.json({ success: true, monitors: monitorsWithHistory });
    }
    
    return c.json({ success: true, monitors: result.results });
  } catch (error) {
    console.error('获取监控列表错误:', error);
    return c.json({ success: false, message: '获取监控列表失败' }, 500);
  }
});

// 获取单个监控
monitors.get('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const payload = c.get('jwtPayload');
    
    const monitor = await monitorDb.getMonitorById(c.env.DB, id);
    
    if (!monitor) {
      return c.json({ success: false, message: '监控不存在' }, 404);
    }
    
    // 检查权限
    if (payload.role !== 'admin' && monitor.created_by !== payload.id) {
      return c.json({ success: false, message: '无权访问此监控' }, 403);
    }
    
    // 获取历史状态数据
    const historyResult = await monitorDb.getMonitorStatusHistory(c.env.DB, id);
    
    // 获取最近的检查历史记录
    const checksResult = await monitorDb.getMonitorChecks(c.env.DB, id, 5);
    
    return c.json({ 
      success: true, 
      monitor: {
        ...monitor,
        history: historyResult.results || [],
        checks: checksResult.results || []
      }
    });
  } catch (error) {
    console.error('获取监控详情错误:', error);
    return c.json({ success: false, message: '获取监控详情失败' }, 500);
  }
});

// 创建监控
monitors.post('/', async (c) => {
  try {
    const payload = c.get('jwtPayload');
    const data = await c.req.json();
    
    // 验证必填字段
    if (!data.name || !data.url || !data.method) {
      return c.json({ success: false, message: '缺少必填字段' }, 400);
    }
    
    const now = new Date().toISOString();
    
    // 将 headers 对象转换为 JSON 字符串
    const headers = data.headers ? JSON.stringify(data.headers) : '{}';
    
    // 插入新监控
    const result = await c.env.DB.prepare(
      `INSERT INTO monitors 
       (name, url, method, interval, timeout, expected_status, headers, body, created_by, active, status, uptime, response_time, last_checked, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      data.name,
      data.url,
      data.method,
      data.interval || 60,
      data.timeout || 30,
      data.expectedStatus || 200,
      headers,
      data.body || '',
      payload.id,
      true,
      'pending',
      100.0,
      0,
      null,
      now,
      now
    ).run();
    
    if (!result.success) {
      throw new Error('创建监控失败');
    }
    
    // 获取新创建的监控
    const newMonitor = await c.env.DB.prepare(
      'SELECT * FROM monitors WHERE rowid = last_insert_rowid()'
    ).first<Monitor>();
    
    return c.json({ success: true, monitor: newMonitor }, 201);
  } catch (error) {
    console.error('创建监控错误:', error);
    return c.json({ success: false, message: '创建监控失败' }, 500);
  }
});

// 更新监控
monitors.put('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const payload = c.get('jwtPayload');
    const data = await c.req.json();
    
    // 检查监控是否存在
    const monitor = await c.env.DB.prepare(
      'SELECT * FROM monitors WHERE id = ?'
    ).bind(id).first<Monitor>();
    
    if (!monitor) {
      return c.json({ success: false, message: '监控不存在' }, 404);
    }
    
    // 检查权限
    if (payload.role !== 'admin' && monitor.created_by !== payload.id) {
      return c.json({ success: false, message: '无权修改此监控' }, 403);
    }
    
    // 准备更新数据
    const updates = [];
    const values = [];
    
    if (data.name !== undefined) {
      updates.push('name = ?');
      values.push(data.name);
    }
    
    if (data.url !== undefined) {
      updates.push('url = ?');
      values.push(data.url);
    }
    
    if (data.method !== undefined) {
      updates.push('method = ?');
      values.push(data.method);
    }
    
    if (data.interval !== undefined) {
      updates.push('interval = ?');
      values.push(data.interval);
    }
    
    if (data.timeout !== undefined) {
      updates.push('timeout = ?');
      values.push(data.timeout);
    }
    
    if (data.expectedStatus !== undefined) {
      updates.push('expected_status = ?');
      values.push(data.expectedStatus);
    }
    
    if (data.headers !== undefined) {
      updates.push('headers = ?');
      values.push(JSON.stringify(data.headers));
    }
    
    if (data.body !== undefined) {
      updates.push('body = ?');
      values.push(data.body);
    }
    
    if (data.active !== undefined) {
      updates.push('active = ?');
      values.push(data.active);
    }
    
    if (data.status !== undefined) {
      updates.push('status = ?');
      values.push(data.status);
    }
    
    if (data.uptime !== undefined) {
      updates.push('uptime = ?');
      values.push(data.uptime);
    }
    
    if (data.responseTime !== undefined) {
      updates.push('response_time = ?');
      values.push(data.responseTime);
    }
    
    if (data.lastChecked !== undefined) {
      updates.push('last_checked = ?');
      values.push(data.lastChecked);
    }
    
    updates.push('updated_at = ?');
    values.push(new Date().toISOString());
    
    // 添加 ID 作为 WHERE 条件
    values.push(id);
    
    // 执行更新
    const result = await c.env.DB.prepare(
      `UPDATE monitors SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...values).run();
    
    if (!result.success) {
      throw new Error('更新监控失败');
    }
    
    // 获取更新后的监控
    const updatedMonitor = await c.env.DB.prepare(
      'SELECT * FROM monitors WHERE id = ?'
    ).bind(id).first<Monitor>();
    
    return c.json({ success: true, monitor: updatedMonitor });
  } catch (error) {
    console.error('更新监控错误:', error);
    return c.json({ success: false, message: '更新监控失败' }, 500);
  }
});

// 删除监控
monitors.delete('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const payload = c.get('jwtPayload');
    
    // 检查监控是否存在
    const monitor = await c.env.DB.prepare(
      'SELECT * FROM monitors WHERE id = ?'
    ).bind(id).first<Monitor>();
    
    if (!monitor) {
      return c.json({ success: false, message: '监控不存在' }, 404);
    }
    
    // 检查权限
    if (payload.role !== 'admin' && monitor.created_by !== payload.id) {
      return c.json({ success: false, message: '无权删除此监控' }, 403);
    }

    // 先删除关联的历史数据
    await c.env.DB.prepare(
      'DELETE FROM monitor_status_history WHERE monitor_id = ?'
    ).bind(id).run();
    
    await c.env.DB.prepare(
      'DELETE FROM monitor_checks WHERE monitor_id = ?'
    ).bind(id).run();
    
    // 执行删除
    const result = await c.env.DB.prepare(
      'DELETE FROM monitors WHERE id = ?'
    ).bind(id).run();
    
    if (!result.success) {
      throw new Error('删除监控失败');
    }
    
    return c.json({ success: true, message: '监控已删除' });
  } catch (error) {
    console.error('删除监控错误:', error);
    return c.json({ success: false, message: '删除监控失败' }, 500);
  }
});

// 获取监控状态历史
monitors.get('/:id/history', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const payload = c.get('jwtPayload');
    
    // 检查监控是否存在
    const monitor = await c.env.DB.prepare(
      'SELECT * FROM monitors WHERE id = ?'
    ).bind(id).first<Monitor>();
    
    if (!monitor) {
      return c.json({ success: false, message: '监控不存在' }, 404);
    }
    
    // 检查权限
    if (payload.role !== 'admin' && monitor.created_by !== payload.id) {
      return c.json({ success: false, message: '无权访问此监控历史' }, 403);
    }
    
    // 获取历史状态
    const historyResult = await c.env.DB.prepare(
      `SELECT * FROM monitor_status_history 
       WHERE monitor_id = ? 
       ORDER BY timestamp ASC`
    ).bind(id).all<MonitorStatusHistory>();
    
    return c.json({ 
      success: true, 
      history: historyResult.results || [] 
    });
  } catch (error) {
    console.error('获取监控历史错误:', error);
    return c.json({ success: false, message: '获取监控历史失败' }, 500);
  }
});

// 获取监控检查记录
monitors.get('/:id/checks', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const payload = c.get('jwtPayload');
    const limit = parseInt(c.req.query('limit') || '10');
    
    // 检查监控是否存在
    const monitor = await monitorDb.getMonitorById(c.env.DB, id);
    
    if (!monitor) {
      return c.json({ success: false, message: '监控不存在' }, 404);
    }
    
    // 检查权限
    if (payload.role !== 'admin' && monitor.created_by !== payload.id) {
      return c.json({ success: false, message: '无权访问此监控检查记录' }, 403);
    }
    
    // 获取检查记录
    const checksResult = await monitorDb.getMonitorChecks(c.env.DB, id, limit);
    
    return c.json({ 
      success: true, 
      checks: checksResult.results || [] 
    });
  } catch (error) {
    console.error('获取监控检查记录错误:', error);
    return c.json({ success: false, message: '获取监控检查记录失败' }, 500);
  }
});

// 手动检查单个监控
monitors.post('/:id/check', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const payload = c.get('jwtPayload');
    
    // 检查监控是否存在
    const monitor = await monitorDb.getMonitorById(c.env.DB, id);
    
    if (!monitor) {
      return c.json({ success: false, message: '监控不存在' }, 404);
    }
    
    // 检查权限
    if (payload.role !== 'admin' && monitor.created_by !== payload.id) {
      return c.json({ success: false, message: '无权访问此监控' }, 403);
    }
    
    // 使用抽象出来的通用检查监控函数进行检查
    const result = await monitorDb.checkSingleMonitor(c.env.DB, monitor);
    
    // 新增处理通知的逻辑
    try {
      const { shouldSendNotification, sendNotification } = await import('../utils/notification');
      
      // 判断是否需要发送通知
      if (result.previous_status !== result.status) {
        console.log(`状态已变化: ${result.previous_status} -> ${result.status}`);
        
        // 检查是否需要发送通知
        console.log(`检查通知设置...`);
        const notificationCheck = await shouldSendNotification(
          c.env.DB,
          'monitor',
          monitor.id,
          result.previous_status,
          result.status
        );
        
        console.log(`通知判断结果: shouldSend=${notificationCheck.shouldSend}, channels=${JSON.stringify(notificationCheck.channels)}`);
        
        if (notificationCheck.shouldSend && notificationCheck.channels.length > 0) {
          console.log(`监控 ${monitor.name} (ID: ${monitor.id}) 状态变更，正在发送通知...`);
          
          // 准备通知变量
          const variables = {
            name: monitor.name,
            status: result.status,
            previous_status: result.previous_status || '未知',
            time: new Date().toLocaleString('zh-CN'),
            response_time: `${result.responseTime}ms`,
            url: monitor.url,
            status_code: result.statusCode ? result.statusCode.toString() : '无',
            expected_status_code: monitor.expected_status.toString(),
            error: result.error || '无',
            details: `URL: ${monitor.url}\n响应时间: ${result.responseTime}ms\n状态码: ${result.statusCode || '无'}\n错误信息: ${result.error || '无'}`
          };
          
          console.log(`通知变量: ${JSON.stringify(variables)}`);
          
          // 发送通知
          console.log(`开始发送通知...`);
          const notificationResult = await sendNotification(
            c.env.DB,
            'monitor',
            monitor.id,
            variables,
            notificationCheck.channels
          );
          
          console.log(`通知发送结果: ${JSON.stringify(notificationResult)}`);
          
          if (notificationResult.success) {
            console.log(`监控 ${monitor.name} (ID: ${monitor.id}) 通知发送成功`);
          } else {
            console.error(`监控 ${monitor.name} (ID: ${monitor.id}) 通知发送失败`);
          }
        } else {
          console.log(`监控 ${monitor.name} (ID: ${monitor.id}) 状态变更，但不需要发送通知`);
        }
      } else {
        console.log(`监控 ${monitor.name} (ID: ${monitor.id}) 状态未变更，不发送通知`);
      }
    } catch (notificationError) {
      console.error('处理通知时出错:', notificationError);
      // 通知处理错误不影响主流程返回
    }
    
    return c.json({ 
      success: true,
      message: '监控检查完成',
      result
    });
  } catch (error) {
    console.error('手动检查监控错误:', error);
    return c.json({ success: false, message: '手动检查监控失败' }, 500);
  }
});

export default monitors; 
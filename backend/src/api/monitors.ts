import { Hono } from "hono";
import { Bindings } from "../models/db";
import * as MonitorService from "../services/MonitorService";

const monitors = new Hono<{ Bindings: Bindings }>();

// 获取所有监控
monitors.get("/", async (c) => {
  const payload = c.get("jwtPayload");

  // 调用服务层获取监控列表
  const result = await MonitorService.getAllMonitors(
    c.env.DB,
    payload.id,
    payload.role
  );

  return c.json(
    {
      success: result.success,
      monitors: result.monitors,
      message: result.message,
    },
    result.status as any
  );
});

// 获取单个监控
monitors.get("/:id", async (c) => {
  const id = parseInt(c.req.param("id"));
  const payload = c.get("jwtPayload");

  // 调用服务层获取监控详情
  const result = await MonitorService.getMonitorById(
    c.env.DB,
    id,
    payload.id,
    payload.role
  );

  return c.json(
    {
      success: result.success,
      monitor: result.monitor,
      message: result.message,
    },
    result.status as any
  );
});

// 创建监控
monitors.post("/", async (c) => {
  const payload = c.get("jwtPayload");
  const data = await c.req.json();

  // 调用服务层创建监控
  const result = await MonitorService.createMonitor(c.env.DB, data, payload.id);

  return c.json(
    {
      success: result.success,
      monitor: result.monitor,
      message: result.message,
    },
    result.status as any
  );
});

// 更新监控
monitors.put("/:id", async (c) => {
  const id = parseInt(c.req.param("id"));
  const payload = c.get("jwtPayload");
  const data = await c.req.json();

  // 调用服务层更新监控
  const result = await MonitorService.updateMonitor(
    c.env.DB,
    id,
    data,
    payload.id,
    payload.role
  );

  return c.json(
    {
      success: result.success,
      monitor: result.monitor,
      message: result.message,
    },
    result.status as any
  );
});

// 删除监控
monitors.delete("/:id", async (c) => {
  const id = parseInt(c.req.param("id"));
  const payload = c.get("jwtPayload");

  // 调用服务层删除监控
  const result = await MonitorService.deleteMonitor(
    c.env.DB,
    id,
    payload.id,
    payload.role
  );

  return c.json(
    {
      success: result.success,
      message: result.message,
    },
    result.status as any
  );
});

// 获取监控状态历史
monitors.get("/:id/history", async (c) => {
  const id = parseInt(c.req.param("id"));
  const payload = c.get("jwtPayload");

  // 调用服务层获取监控历史
  const result = await MonitorService.getMonitorStatusHistoryById(
    c.env.DB,
    id,
    payload.id,
    payload.role
  );

  return c.json(
    {
      success: result.success,
      history: result.history,
      message: result.message,
    },
    result.status as any
  );
});
// 手动检查单个监控
monitors.post("/:id/check", async (c) => {
  const id = parseInt(c.req.param("id"));
  const payload = c.get("jwtPayload");

  // 调用服务层手动检查监控
  const result = await MonitorService.manualCheckMonitor(
    c.env.DB,
    id,
    payload.id,
    payload.role,
    c.env
  );

  return c.json(
    {
      success: result.success,
      message: result.message,
      result: result.result,
    },
    result.status as any
  );
});

export { monitors };

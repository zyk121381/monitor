import { Hono } from "hono";
import { Bindings } from "../models/db";
import { runMigrations } from "../migrations/migration";
export const migrate = new Hono<{ Bindings: Bindings }>();

// 获取所有监控
migrate.get("/", async (c) => {
  try {
    // 调用服务层获取监控列表
    const result = await runMigrations(c.env);
    return c.json(
      {
        success: true,
        message: "迁移成功",
        result: result,
      },
      200
    );
  } catch (error) {
    console.error("迁移失败:", error);
    return c.json({ success: false, message: "迁移失败" }, 500);
  }
});

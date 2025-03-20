import { Hono } from 'hono';
import { Bindings } from '../models/db';
declare const app: Hono<{
    Bindings: Bindings;
}, import("hono/types").BlankSchema, "/">;
export default app;

import { Hono } from 'hono';
import { Bindings } from '../models/db';
declare const initDb: Hono<{
    Bindings: Bindings;
}, import("hono/types").BlankSchema, "/">;
export default initDb;

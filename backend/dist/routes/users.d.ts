import { Hono } from 'hono';
import { Bindings } from '../models/db';
declare const users: Hono<{
    Bindings: Bindings;
}, import("hono/types").BlankSchema, "/">;
export default users;

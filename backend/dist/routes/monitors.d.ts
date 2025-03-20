import { Hono } from 'hono';
import { Bindings } from '../models/db';
declare const monitors: Hono<{
    Bindings: Bindings;
}, import("hono/types").BlankSchema, "/">;
export default monitors;

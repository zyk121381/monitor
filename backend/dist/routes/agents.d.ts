import { Hono } from 'hono';
import { Bindings } from '../models/db';
import { Agent } from '../models/agent';
declare const agents: Hono<{
    Bindings: Bindings;
    Variables: {
        agent: Agent;
        jwtPayload: any;
    };
}, import("hono/types").BlankSchema, "/">;
export default agents;

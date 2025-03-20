import { Bindings } from './models/db';
declare global {
    namespace NodeJS {
        interface ProcessEnv {
            NODE_ENV?: string;
            PORT?: string;
            JWT_SECRET?: string;
        }
    }
}
declare const _default: {
    fetch: (request: Request, Env?: {} | Bindings | undefined, executionCtx?: import("hono").ExecutionContext) => Response | Promise<Response>;
    scheduled(event: any, env: any, ctx: any): Promise<void>;
};
export default _default;

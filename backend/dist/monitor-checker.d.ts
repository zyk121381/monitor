import { Bindings } from './models/db';
declare const _default: {
    scheduled(event: any, env: any, ctx: any): Promise<void>;
    fetch: (request: Request, Env?: {} | Bindings | undefined, executionCtx?: import("hono").ExecutionContext) => Response | Promise<Response>;
};
export default _default;

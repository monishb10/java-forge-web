import handler from 'vinext/server/fetch-handler';
import { handleRequest, type AuthEnv } from '../lib/auth';

export default {
  fetch(request: Request, env: AuthEnv, ctx: ExecutionContext) {
    return handleRequest(request, env, verified => handler.fetch(verified, env, ctx));
  },
};

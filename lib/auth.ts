/** Standalone Workers authentication boundary. No browser-supplied identity is trusted. */
export type AuthEnv = {
  DB: D1Database;
  APP_URL: string;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
};
export type Account = { id: string; login: string; name: string };
type Session = { user_id: string; login: string; name: string; expires_at: number };
const SESSION_SECONDS = 7 * 24 * 60 * 60;
const ATTEMPT_SECONDS = 10 * 60;
const encoder = new TextEncoder();

function randomToken() {
  return btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))))
    .replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}
async function hash(value: string) {
  const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value)));
  return btoa(String.fromCharCode(...bytes)).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}
function readCookie(req: Request, name: string) {
  const matches = (req.headers.get('cookie') || '').split(';').map(p => p.trim())
    .filter(p => p.startsWith(name + '='));
  // Duplicate cookies are ambiguous: do not select one on the caller's behalf.
  return matches.length === 1 ? matches[0].slice(name.length + 1) : '';
}
function cookie(name: string, value: string, seconds: number, secure: boolean) {
  return `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${seconds}${secure ? '; Secure' : ''}`;
}
function reply(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'private, no-store' } });
}
function message(text: string, status: number) { return reply({ error: text }, status); }
function callbackError(text: string, status: number) {
  // Only static text written by this module reaches this page; never provider messages or codes.
  return new Response(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Sign in — Java Forge</title><body><main><h1>Could not sign in</h1><p>${text}</p><p><a href="/auth/github">Try signing in again</a> · <a href="/">Back to Java Forge</a></p></main></body></html>`, {
    status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' },
  });
}
function redirect(path: string, status: number, cookieValues: string[]) {
  const headers = new Headers({ Location: path, 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer' });
  for (const value of cookieValues) headers.append('Set-Cookie', value);
  return new Response(null, { status, headers });
}

export async function handleRequest(request: Request, env: AuthEnv, next: (request: Request) => Promise<Response>): Promise<Response> {
  try {
    const url = new URL(request.url);
    let canonical: URL;
    try { canonical = new URL(env.APP_URL); } catch { return message('The website owner needs to finish account setup. See the deployment guide.', 503); }
    const local = canonical.protocol === 'http:' && ['127.0.0.1', 'localhost', '[::1]'].includes(canonical.hostname);
    if ((!local && canonical.protocol !== 'https:') || canonical.username || canonical.password || canonical.pathname !== '/' || canonical.search || canonical.hash) {
      return message('The website account URL is not configured correctly.', 503);
    }
    if (url.origin !== canonical.origin) return message('Use the configured website address to sign in.', 403);
    const secure = !local;
    const sessionName = secure ? '__Host-jf_session' : 'jf_session_dev';
    const attemptName = secure ? '__Host-jf_oauth' : 'jf_oauth_dev';
    const rawSession = readCookie(request, sessionName);
    const now = Date.now();
    const isMutation = !['GET', 'HEAD', 'OPTIONS'].includes(request.method);
    if (isMutation && request.headers.get('origin') !== canonical.origin) return message('Request origin does not match this website.', 403);
    const session = /^[A-Za-z0-9_-]{43}$/.test(rawSession)
      ? await env.DB.prepare('SELECT user_id,login,name,expires_at FROM auth_sessions WHERE token_hash=? AND expires_at>?')
        .bind(await hash(rawSession), now).first<Session>()
      : null;
    const user: Account | null = session ? { id: session.user_id, login: session.login, name: session.name } : null;
    const expected = request.headers.get('x-java-forge-account');

    if (url.pathname === '/auth/github') {
      if (request.method !== 'GET') return message('Use GET to start sign-in.', 405);
      if (!env.DB || !env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) return message('GitHub sign-in is not configured yet. The website owner must complete docs/DEPLOY.md.', 503);
      const state = randomToken(), browser = randomToken(), verifier = randomToken();
      await env.DB.batch([
        env.DB.prepare('DELETE FROM auth_attempts WHERE expires_at<=?').bind(now),
        env.DB.prepare('DELETE FROM auth_sessions WHERE expires_at<=?').bind(now),
        env.DB.prepare('INSERT INTO auth_attempts(state_hash,browser_hash,verifier,expires_at) VALUES(?,?,?,?)')
          .bind(await hash(state), await hash(browser), verifier, now + ATTEMPT_SECONDS * 1000),
      ]);
      const authorize = new URL('https://github.com/login/oauth/authorize');
      authorize.search = new URLSearchParams({
        client_id: env.GITHUB_CLIENT_ID, redirect_uri: canonical.origin + '/auth/callback',
        scope: 'read:user', state, code_challenge: await hash(verifier), code_challenge_method: 'S256', prompt: 'select_account',
      }).toString();
      return redirect(authorize.href, 302, [cookie(attemptName, browser, ATTEMPT_SECONDS, secure)]);
    }

    if (url.pathname === '/auth/callback') {
      if (request.method !== 'GET') return message('Use GET for the sign-in callback.', 405);
      const state = url.searchParams.get('state') || '', code = url.searchParams.get('code') || '';
      const browser = readCookie(request, attemptName);
      if (url.searchParams.has('error') || !/^[A-Za-z0-9_-]{43}$/.test(state) || !/^[A-Za-z0-9_-]{43}$/.test(browser) || !code || code.length > 512) {
        return callbackError('Sign-in was cancelled or could not be verified. Please start again.', 400);
      }
      // Consume once, only in the originating browser, before contacting GitHub.
      const attempt = await env.DB.prepare('DELETE FROM auth_attempts WHERE state_hash=? AND browser_hash=? AND expires_at>? RETURNING verifier')
        .bind(await hash(state), await hash(browser), now).first<{ verifier: string }>();
      if (!attempt) return callbackError('This sign-in has expired or was already used. Please start again.', 400);
      if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) return callbackError('The website owner needs to finish GitHub sign-in setup.', 503);
      const exchange = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ client_id: env.GITHUB_CLIENT_ID, client_secret: env.GITHUB_CLIENT_SECRET,
          code, code_verifier: attempt.verifier, redirect_uri: canonical.origin + '/auth/callback' }),
        signal: AbortSignal.timeout(15000),
      });
      if (!exchange.ok) return callbackError('GitHub could not complete sign-in. Please try again.', 502);
      const token = await exchange.json() as { access_token?: string; token_type?: string; error?: string };
      if (token.error || typeof token.access_token !== 'string' || !token.access_token || token.token_type?.toLowerCase() !== 'bearer') {
        return callbackError('GitHub did not approve this sign-in. Please try again.', 502);
      }
      const profileResponse = await fetch('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${token.access_token}`, Accept: 'application/vnd.github+json', 'User-Agent': 'Java-Forge' },
        signal: AbortSignal.timeout(15000),
      });
      if (!profileResponse.ok) return callbackError('Your GitHub account could not be verified. Please try again.', 502);
      const profile = await profileResponse.json() as { id?: number; login?: string; name?: string | null };
      if (!Number.isSafeInteger(profile.id) || (profile.id || 0) <= 0 || typeof profile.login !== 'string' || !/^[a-z\d][a-z\d-]{0,38}$/i.test(profile.login)) {
        return callbackError('GitHub returned an incomplete account profile. Please try again.', 502);
      }
      const sessionToken = randomToken();
      await env.DB.batch([
        env.DB.prepare('DELETE FROM auth_sessions WHERE token_hash=?').bind(await hash(rawSession)),
        env.DB.prepare('INSERT INTO auth_sessions(token_hash,user_id,login,name,expires_at) VALUES(?,?,?,?,?)')
          .bind(await hash(sessionToken), `github:${profile.id}`, profile.login,
            typeof profile.name === 'string' ? profile.name.slice(0,120) : profile.login, now + SESSION_SECONDS * 1000),
      ]);
      // The OAuth access token is deliberately discarded, never saved or sent to the browser.
      return redirect('/', 303, [cookie(sessionName, sessionToken, SESSION_SECONDS, secure), cookie(attemptName, '', 0, secure)]);
    }

    if (url.pathname === '/auth/logout') {
      if (request.method !== 'POST') return message('Use POST to sign out.', 405);
      if (user && expected !== user.id) return message('Your signed-in account changed. Reload this page before continuing.', 409);
      if (rawSession) await env.DB.prepare('DELETE FROM auth_sessions WHERE token_hash=?').bind(await hash(rawSession)).run();
      const response = reply({ signedOut: true });
      response.headers.append('Set-Cookie', cookie(sessionName, '', 0, secure));
      return response;
    }
    if (url.pathname.startsWith('/auth/')) return message('Not found.', 404);
    if (url.pathname === '/api/account') {
      if (request.method !== 'GET') return message('Use GET to read your account.', 405);
      return reply({ user });
    }
    if (url.pathname.startsWith('/api/') || isMutation) {
      if (!user) return message('Sign in with GitHub to save progress and run code.', 401);
      if ((expected && expected !== user.id) || (isMutation && expected !== user.id)) {
        return message('Your signed-in account changed. Copy any unsaved code, then reload this page.', 409);
      }
    }
    const headers = new Headers(request.headers);
    for (const key of [...headers.keys()]) if (key.toLowerCase().startsWith('oai-authenticated-user-')) headers.delete(key);
    if (user) headers.set('oai-authenticated-user-id', user.id);
    const response = await next(new Request(request, { headers }));
    const output = new Response(response.body, response);
    output.headers.set('Cache-Control', 'private, no-store');
    output.headers.set('X-Content-Type-Options', 'nosniff');
    output.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    output.headers.set('X-Frame-Options', 'DENY');
    return output;
  } catch {
    // Avoid logging provider responses, request cookies, authorization codes or credentials.
    return message('Account services are temporarily unavailable. Keep your code and try again.', 503);
  }
}

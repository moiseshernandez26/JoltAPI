import type { IResolvedHttpRequest, IHttpResponse, IHttpResponseHeader, IProxyConfig } from '../models';
import { buildUrl, redactUrl, classifyFetchError, HttpError } from './httpErrors';
import { isRedirectStatus, nextRedirectStep, type IRedirectStep } from './redirects';

export { shellEscape, buildCurlCommand, buildCurlProxyFlags } from './curlUtils';

/**
 * Creates an undici ProxyAgent for the given proxy configuration.
 *
 * `undici` is a real `dependencies` entry (see package.json) and must ship in the VSIX —
 * check `.vscodeignore` if this starts silently returning `undefined` again. Exported for
 * unit testing: a passing test here is what would have caught the bug where `undici` was
 * never installed as a dependency, so this always failed silently in production.
 */
export function createProxyAgent(proxy: IProxyConfig): unknown {
  try {
    const { ProxyAgent } = require('undici') as { ProxyAgent: new (opts: Record<string, unknown>) => unknown };
    const auth = proxy.auth?.username
      ? `${proxy.auth.username}:${proxy.auth.password ?? ''}`
      : undefined;
    return new ProxyAgent({
      uri: `http://${proxy.host}:${proxy.port}`,
      ...(auth ? { token: `Basic ${Buffer.from(auth).toString('base64')}` } : {}),
    });
  } catch (err) {
    console.error('[JoltAPI] Failed to create proxy agent — proxy will NOT be applied:', err);
    return undefined;
  }
}

/**
 * Creates a custom undici Agent that disables SSL verification. See `createProxyAgent` for
 * why this is exported and why a failure here is logged rather than swallowed silently.
 */
export function createInsecureAgent(): unknown {
  try {
    const { Agent } = require('undici') as { Agent: new (opts: Record<string, unknown>) => unknown };
    return new Agent({
      connect: {
        rejectUnauthorized: false,
      },
    });
  } catch (err) {
    console.error('[JoltAPI] Failed to create insecure SSL agent — sslVerify:false will NOT be applied:', err);
    return undefined;
  }
}

/**
 * Executes an HTTP request and returns a structured response.
 * Uses Node.js native fetch (undici under the hood, available in Node 18+).
 */
export async function executeRequest(request: IResolvedHttpRequest): Promise<IHttpResponse> {
  const startTime = Date.now();
  const url = buildUrl(request.url);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), request.timeout);

  const fetchOptions: RequestInit = {
    method: request.method,
    headers: request.headers,
    signal: controller.signal,
  };

  if (request.body && request.method !== 'GET' && request.method !== 'HEAD') {
    fetchOptions.body = request.body;
  }

  const hasProxy = request.proxy?.enabled && request.proxy.host && request.proxy.port;

  if (hasProxy) {
    const agent = createProxyAgent(request.proxy!);
    if (!agent) {
      // Never fall through to an unproxied request: the caller asked for this traffic to go
      // through a proxy, and sending it direct would leak it with only a console warning.
      clearTimeout(timeoutId);
      throw new HttpError(
        `Could not build a proxy agent for ${request.proxy!.host}:${request.proxy!.port}. ` +
          'The host must be a bare hostname or IP — no scheme, port, or path. The request was NOT sent.',
        'PROXY_AGENT_FAILED',
      );
    }
    (fetchOptions as Record<string, unknown>).dispatcher = agent;
  } else if (!request.sslVerify) {
    const agent = createInsecureAgent();
    if (agent) {
      (fetchOptions as Record<string, unknown>).dispatcher = agent;
    }
  }

  // Redirects are followed here rather than by `fetch` itself: that is the only way to
  // honor `maxRedirects`, to stop at the first hop when `followRedirects` is off, and to
  // drop credentials when a redirect crosses origins (see services/redirects.ts).
  const maxRedirects = request.followRedirects ? Math.max(0, request.maxRedirects ?? 0) : 0;
  let step: IRedirectStep = {
    url,
    method: request.method,
    headers: { ...request.headers },
    body: fetchOptions.body as string | undefined,
  };

  let response: Response;
  let hops = 0;
  for (;;) {
    try {
      console.log(`[JoltAPI] Executing ${step.method} ${redactUrl(step.url)}`);
      response = await fetch(step.url, {
        ...fetchOptions,
        method: step.method,
        headers: step.headers,
        body: step.body,
        redirect: 'manual',
      });
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      console.error(`[JoltAPI] HTTP request failed for ${redactUrl(step.url)}`);
      throw classifyFetchError(err, request.timeout);
    }

    if (!isRedirectStatus(response.status) || hops >= maxRedirects) {break;}

    const next = nextRedirectStep(step, response.status, response.headers.get('location'));
    if (!next) {break;}

    hops += 1;
    console.log(`[JoltAPI] Redirect ${response.status} → ${redactUrl(next.url)} (hop ${hops}/${maxRedirects})`);
    step = next;
  }
  clearTimeout(timeoutId);

  const responseTimeMs = Date.now() - startTime;
  const responseBody = await response.text();
  console.log(`[JoltAPI] Response ${response.status} from ${redactUrl(step.url)} (${responseTimeMs}ms, ${responseBody.length}B)`);
  const responseSizeBytes = new TextEncoder().encode(responseBody).length;
  const contentType = response.headers.get('content-type') ?? '';

  const headers: IHttpResponseHeader[] = [];
  response.headers.forEach((value, name) => {
    headers.push({ name, value });
  });

  return {
    statusCode: response.status,
    statusText: response.statusText,
    headers,
    body: responseBody,
    contentType,
    responseTimeMs,
    responseSizeBytes,
    // The URL/method actually answered — after redirects these can differ from the request.
    requestUrl: step.url,
    requestMethod: (step.method as IResolvedHttpRequest['method']),
    timestamp: Date.now(),
  };
}


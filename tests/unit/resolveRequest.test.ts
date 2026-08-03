import { strict as assert } from 'assert';
import { resolveHttpRequest } from '../../src/panels/handlers/resolveRequest';
import { extractUnresolved } from '../../src/panels/handlers/interpolation';
import type { IHttpRequest, IProxyProfile } from '../../src/models';

const PROFILE: IProxyProfile = {
  id: 'proxy-1',
  name: 'Corporate',
  host: 'proxy.example.com',
  port: 8080,
};

function makeRequest(overrides: Partial<IHttpRequest> = {}): IHttpRequest {
  return {
    id: 'req-1',
    name: 'Test Request',
    method: 'GET',
    url: 'https://api.example.com/path',
    headers: [],
    queryParams: [],
    body: { type: 'none' },
    auth: { type: 'none' },
    settings: { timeout: 30000, sslVerify: true, followRedirects: true, maxRedirects: 5 },
    ...overrides,
  };
}

suite('resolveRequest', () => {
  suite('resolveHttpRequest — variable interpolation ordering', () => {
    test('interpolates a variable used in a query param value', () => {
      const request = makeRequest({
        queryParams: [{ id: 'q1', key: 'auth', value: '{{token}}', enabled: true }],
      });
      const { resolved } = resolveHttpRequest(request, [
        { key: 'token', value: 'SECRET123', enabled: true },
      ]);
      assert.ok(resolved.url.includes('auth=SECRET123'), `expected resolved value in URL, got: ${resolved.url}`);
      assert.ok(!resolved.url.includes('%7B%7B'), `URL should not contain percent-encoded braces: ${resolved.url}`);
    });

    test('interpolates a variable used in a query param key', () => {
      const request = makeRequest({
        queryParams: [{ id: 'q1', key: '{{paramName}}', value: 'v', enabled: true }],
      });
      const { resolved } = resolveHttpRequest(request, [
        { key: 'paramName', value: 'page', enabled: true },
      ]);
      assert.ok(resolved.url.includes('page=v'), resolved.url);
    });

    test('interpolates an apiKey auth value placed in the query string', () => {
      const request = makeRequest({
        auth: { type: 'apiKey', apiKeyName: 'apiKey', apiKeyValue: '{{apiKey}}', apiKeyPlacement: 'query' },
      });
      const { resolved } = resolveHttpRequest(request, [
        { key: 'apiKey', value: 'KEY_VALUE', enabled: true },
      ]);
      assert.ok(resolved.url.includes('apiKey=KEY_VALUE'), resolved.url);
      assert.ok(!resolved.url.includes('%7B%7B'), resolved.url);
    });

    test('unresolved variables in query params are still detectable after resolution', () => {
      const request = makeRequest({
        queryParams: [{ id: 'q1', key: 'auth', value: '{{missing}}', enabled: true }],
      });
      const { rawPieces } = resolveHttpRequest(request, []);
      const unresolved = extractUnresolved(...rawPieces);
      assert.deepEqual(unresolved, ['{{missing}}']);
    });

    test('interpolates header keys and values', () => {
      const request = makeRequest({
        headers: [{ id: 'h1', key: '{{env}}-token', value: '{{secret}}', enabled: true }],
      });
      const { resolved } = resolveHttpRequest(request, [
        { key: 'env', value: 'prod', enabled: true },
        { key: 'secret', value: 's3cr3t', enabled: true },
      ]);
      assert.equal(resolved.headers['prod-token'], 's3cr3t');
      assert.equal(Object.keys(resolved.headers).length, 1);
    });

    test('interpolates JSON body content', () => {
      const request = makeRequest({
        method: 'POST',
        body: { type: 'json', jsonBody: '{"user":"{{username}}"}' },
      });
      const { resolved } = resolveHttpRequest(request, [
        { key: 'username', value: 'alice', enabled: true },
      ]);
      assert.equal(resolved.body, '{"user":"alice"}');
    });

    test('interpolates multipart form-data field keys and values', () => {
      const request = makeRequest({
        method: 'POST',
        body: {
          type: 'form-data',
          formEncoding: 'multipart',
          formData: [{ id: 'f1', key: '{{fieldName}}', value: '{{fieldValue}}', enabled: true }],
        },
      });
      const { resolved } = resolveHttpRequest(request, [
        { key: 'fieldName', value: 'name', enabled: true },
        { key: 'fieldValue', value: 'Bob', enabled: true },
      ]);
      assert.ok(resolved.body?.includes('name="name"'), resolved.body);
      assert.ok(resolved.body?.includes('Bob'), resolved.body);
    });
  });

  suite('resolveHttpRequest — saved proxy profiles', () => {
    test('no proxyId means the request is sent directly', () => {
      const { resolved, missingProxyId } = resolveHttpRequest(makeRequest(), [], [PROFILE]);
      assert.equal(resolved.proxy, undefined);
      assert.equal(missingProxyId, undefined);
    });

    test('proxyId resolves to the saved profile host/port', () => {
      const request = makeRequest({ proxyId: 'proxy-1' });
      const { resolved, missingProxyId } = resolveHttpRequest(request, [], [PROFILE]);
      assert.equal(missingProxyId, undefined);
      assert.equal(resolved.proxy?.enabled, true);
      assert.equal(resolved.proxy?.host, 'proxy.example.com');
      assert.equal(resolved.proxy?.port, 8080);
    });

    test('profile auth is carried into the resolved proxy config', () => {
      const request = makeRequest({ proxyId: 'proxy-1' });
      const withAuth: IProxyProfile = { ...PROFILE, auth: { username: 'bob', password: 'pw' } };
      const { resolved } = resolveHttpRequest(request, [], [withAuth]);
      assert.deepEqual(resolved.proxy?.auth, { username: 'bob', password: 'pw' });
    });

    // A deleted profile must NOT silently fall back to a direct connection — traffic the
    // user routed through a proxy would leak out. The caller turns this into an error.
    test('a proxyId with no matching profile reports missingProxyId and no proxy', () => {
      const request = makeRequest({ proxyId: 'gone' });
      const { resolved, missingProxyId } = resolveHttpRequest(request, [], [PROFILE]);
      assert.equal(missingProxyId, 'gone');
      assert.equal(resolved.proxy, undefined);
    });

    test('legacy inline proxy (pre-0.5.0 requests) is still honored', () => {
      const request = makeRequest({
        proxy: { enabled: true, host: 'old.example.com', port: 3128 },
      });
      const { resolved, missingProxyId } = resolveHttpRequest(request, [], [PROFILE]);
      assert.equal(missingProxyId, undefined);
      assert.equal(resolved.proxy?.host, 'old.example.com');
      assert.equal(resolved.proxy?.port, 3128);
    });

    test('a disabled legacy inline proxy is ignored', () => {
      const request = makeRequest({
        proxy: { enabled: false, host: 'old.example.com', port: 3128 },
      });
      const { resolved } = resolveHttpRequest(request, [], []);
      assert.equal(resolved.proxy, undefined);
    });

    test('proxyId wins over a legacy inline proxy', () => {
      const request = makeRequest({
        proxyId: 'proxy-1',
        proxy: { enabled: true, host: 'old.example.com', port: 3128 },
      });
      const { resolved } = resolveHttpRequest(request, [], [PROFILE]);
      assert.equal(resolved.proxy?.host, 'proxy.example.com');
    });
  });
});

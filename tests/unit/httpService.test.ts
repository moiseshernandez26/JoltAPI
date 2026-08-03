import { strict as assert } from 'assert';
import { buildCurlCommand, createProxyAgent, createInsecureAgent, executeRequest } from '../../src/services/httpService';

suite('httpService', () => {
  // Regression coverage: `undici` used to be `require()`d without being a declared
  // `dependencies` entry, so these two always failed silently and returned `undefined`
  // in the packaged extension — proxy support and "disable SSL verification" silently
  // did nothing, with no error surfaced anywhere. See docs/handoff/16_CHANGES.md.
  suite('createProxyAgent / createInsecureAgent — undici must actually be resolvable', () => {
    test('createProxyAgent returns a real agent, not undefined', () => {
      const agent = createProxyAgent({ enabled: true, host: 'proxy.example.com', port: 8080 });
      assert.notEqual(agent, undefined);
      assert.equal(typeof agent, 'object');
    });

    test('createProxyAgent includes auth when username/password are set', () => {
      const agent = createProxyAgent({
        enabled: true,
        host: 'proxy.example.com',
        port: 8080,
        auth: { username: 'user', password: 'pass' },
      });
      assert.notEqual(agent, undefined);
    });

    test('createInsecureAgent returns a real agent, not undefined', () => {
      const agent = createInsecureAgent();
      assert.notEqual(agent, undefined);
      assert.equal(typeof agent, 'object');
    });

    test('createProxyAgent returns undefined for a host that cannot form a URI', () => {
      // e.g. a pasted `host:port` landing in the host field → `http://h:8080:8080`
      const agent = createProxyAgent({ enabled: true, host: 'proxy.example.com:8080', port: 8080 });
      assert.equal(agent, undefined);
    });
  });

  // The whole point of the proxy feature is that traffic the user routed through a proxy
  // never leaks out direct. If the agent can't be built, the request must NOT be sent.
  suite('executeRequest — proxy agent failure must abort, not fall back to direct', () => {
    test('throws PROXY_AGENT_FAILED instead of sending unproxied', async () => {
      await assert.rejects(
        () => executeRequest({
          method: 'GET',
          url: 'https://api.example.com/users',
          headers: {},
          proxy: { enabled: true, host: 'proxy.example.com:8080', port: 8080 },
          timeout: 30000,
          sslVerify: true,
          followRedirects: true,
          maxRedirects: 5,
        }),
        (err: unknown) => {
          assert.equal((err as { code?: string }).code, 'PROXY_AGENT_FAILED');
          assert.ok((err as Error).message.includes('NOT sent'));
          return true;
        },
      );
    });
  });


  // A copied command has to reproduce what JoltAPI actually sends. Without --proxy the
  // pasted command silently goes direct, so it tests something else entirely.
  suite('buildCurlCommand — proxy flags', () => {
    test('adds --proxy for a resolved proxy', () => {
      const cmd = buildCurlCommand('GET', 'https://api.example.com', {}, undefined, {
        enabled: true, host: 'proxy.example.com', port: 8080,
      });
      assert.ok(cmd.includes("--proxy 'http://proxy.example.com:8080'"), cmd);
      assert.ok(!cmd.includes('--proxy-user'), cmd);
    });

    test('adds --proxy-user when the proxy has credentials', () => {
      const cmd = buildCurlCommand('POST', 'https://api.example.com', {}, '{}', {
        enabled: true, host: 'proxy.example.com', port: 8080,
        auth: { username: 'bob', password: "pa'ss" },
      });
      assert.ok(cmd.includes("--proxy-user 'bob:pa'\\''ss'"), cmd);
    });

    test('omits proxy flags when there is no proxy, or it is incomplete', () => {
      assert.ok(!buildCurlCommand('GET', 'https://a.com', {}).includes('--proxy'));
      assert.ok(!buildCurlCommand('GET', 'https://a.com', {}, undefined, {
        enabled: false, host: 'proxy.example.com', port: 8080,
      }).includes('--proxy'));
      assert.ok(!buildCurlCommand('GET', 'https://a.com', {}, undefined, {
        enabled: true, host: 'proxy.example.com', port: 0,
      }).includes('--proxy'));
    });
  });

  suite('buildCurlCommand', () => {
    test('GET request with no body', () => {
      const cmd = buildCurlCommand('GET', 'https://api.example.com/users', {});
      assert.ok(cmd.includes('curl'));
      assert.ok(cmd.includes('https://api.example.com/users'));
      assert.ok(!cmd.includes('-d '));
      assert.ok(!cmd.includes('-X '));
    });

    test('POST request with body', () => {
      const cmd = buildCurlCommand(
        'POST',
        'https://api.example.com/users',
        { 'Content-Type': 'application/json' },
        '{"name":"Alice"}',
      );
      assert.ok(cmd.includes('curl'));
      assert.ok(cmd.includes('-X POST'));
      assert.ok(cmd.includes("-d '{\"name\":\"Alice\"}'"));
    });

    test('Headers are properly escaped', () => {
      const cmd = buildCurlCommand(
        'GET',
        'https://api.example.com',
        { Authorization: "Bearer token with 'quotes'" },
      );
      assert.ok(cmd.includes("'Authorization: Bearer token with"));
      assert.ok(cmd.includes("'quotes'"));
    });

    test('URL with special characters', () => {
      const cmd = buildCurlCommand(
        'GET',
        'https://api.example.com/search?q=hello world&filter=a|b',
        {},
      );
      assert.ok(cmd.includes("'https://api.example.com/search?q=hello world&filter=a|b'"));
    });
  });
});
import { strict as assert } from 'assert';
import { buildCurlCommand, createProxyAgent, createInsecureAgent } from '../../src/services/httpService';

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
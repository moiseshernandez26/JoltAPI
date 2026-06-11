import { strict as assert } from 'assert';
import { buildCurlCommand } from '../../src/services/httpService';

suite('httpService', () => {
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
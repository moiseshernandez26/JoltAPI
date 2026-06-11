import { strict as assert } from 'assert';

suite('validators', () => {
  suite('JSON validation', () => {
    function isValidJson(text: string): boolean {
      if (text.trim() === '') {return true;}
      try {
        JSON.parse(text);
        return true;
      } catch {
        return false;
      }
    }

    test('valid JSON object', () => {
      assert.ok(isValidJson('{"key":"value"}'));
    });

    test('valid JSON array', () => {
      assert.ok(isValidJson('[1,2,3]'));
    });

    test('empty string is valid', () => {
      assert.ok(isValidJson(''));
    });

    test('whitespace-only is valid', () => {
      assert.ok(isValidJson('   '));
    });

    test('invalid JSON object', () => {
      assert.ok(!isValidJson('{key:"value"}'));
    });

    test('unclosed object', () => {
      assert.ok(!isValidJson('{"key":"value"'));
    });

    test('trailing comma', () => {
      assert.ok(!isValidJson('{"key":"value",}'));
    });

    test('single quotes are invalid JSON', () => {
      assert.ok(!isValidJson("{'key':'value'}"));
    });

    test('null is valid JSON', () => {
      assert.ok(isValidJson('null'));
    });

    test('numbers and booleans are valid JSON', () => {
      assert.ok(isValidJson('42'));
      assert.ok(isValidJson('3.14'));
      assert.ok(isValidJson('true'));
      assert.ok(isValidJson('false'));
    });
  });

  suite('URL building', () => {
    function buildUrl(baseUrl: string, params?: Record<string, string>): string {
      if (!params || Object.keys(params).length === 0) {return baseUrl;}
      const url = new URL(baseUrl);
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.append(key, value);
      }
      return url.toString();
    }

    test('adds single query param', () => {
      const result = buildUrl('https://api.example.com/users', { page: '1' });
      assert.ok(result.includes('page=1'));
    });

    test('adds multiple query params', () => {
      const result = buildUrl('https://api.example.com/search', { q: 'test', lang: 'en' });
      assert.ok(result.includes('q=test'));
      assert.ok(result.includes('lang=en'));
    });

    test('no params returns base URL', () => {
      const result = buildUrl('https://api.example.com/users');
      assert.equal(result, 'https://api.example.com/users');
    });

    test('empty params returns base URL', () => {
      const result = buildUrl('https://api.example.com/users', {});
      assert.equal(result, 'https://api.example.com/users');
    });
  });

  suite('variable name extraction', () => {
    function extractVarNames(text: string): string[] {
      const matches = text.match(/\{\{([a-zA-Z_][a-zA-Z0-9_-]*)\}\}/g);
      if (!matches) {return [];}
      return [...new Set(matches)];
    }

    test('extracts single variable', () => {
      const result = extractVarNames('{{myVar}}');
      assert.deepEqual(result, ['{{myVar}}']);
    });

    test('deduplicates variables', () => {
      const result = extractVarNames('{{a}}{{a}}{{b}}');
      assert.deepEqual(result, ['{{a}}', '{{b}}']);
    });

    test('returns empty for no variables', () => {
      assert.deepEqual(extractVarNames('no vars'), []);
    });
  });
});
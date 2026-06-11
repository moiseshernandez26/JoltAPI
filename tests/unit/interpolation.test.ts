import { strict as assert } from 'assert';
import { interpolateTemplate, extractUnresolved } from '../../src/panels/handlers/interpolation';

suite('interpolation', () => {
  const vars = [
    { key: 'baseUrl', value: 'https://api.example.com', enabled: true },
    { key: 'token', value: 'secret123', enabled: true },
    { key: 'disabledVar', value: 'should-not-appear', enabled: false },
    { key: 'api_key', value: 'KEY_123', enabled: true },
  ];

  suite('interpolateTemplate', () => {
    test('replaces simple variable', () => {
      const result = interpolateTemplate('{{baseUrl}}/users', vars);
      assert.equal(result, 'https://api.example.com/users');
    });

    test('replaces multiple variables', () => {
      const result = interpolateTemplate('{{baseUrl}}/data?key={{api_key}}', vars);
      assert.equal(result, 'https://api.example.com/data?key=KEY_123');
    });

    test('leaves disabled variables untouched', () => {
      const result = interpolateTemplate('Value: {{disabledVar}}', vars);
      assert.equal(result, 'Value: {{disabledVar}}');
    });

    test('leaves unrecognized variables untouched', () => {
      const result = interpolateTemplate('{{unknown}}/path', vars);
      assert.equal(result, '{{unknown}}/path');
    });

    test('handles empty text', () => {
      const result = interpolateTemplate('', vars);
      assert.equal(result, '');
    });

    test('handles text with no variables', () => {
      const result = interpolateTemplate('static text', vars);
      assert.equal(result, 'static text');
    });

    test('handles empty variables array', () => {
      const result = interpolateTemplate('{{baseUrl}}/path', []);
      assert.equal(result, '{{baseUrl}}/path');
    });
  });

  suite('extractUnresolved', () => {
    test('extracts variable from text', () => {
      const result = extractUnresolved('{{baseUrl}}/users');
      assert.deepEqual(result, ['{{baseUrl}}']);
    });

    test('extracts multiple unique variables', () => {
      const result = extractUnresolved('{{a}}{{b}}{{a}}');
      assert.deepEqual(result, ['{{a}}', '{{b}}']);
    });

    test('returns empty array for text without variables', () => {
      const result = extractUnresolved('no variables here');
      assert.deepEqual(result, []);
    });

    test('returns empty array for empty text', () => {
      const result = extractUnresolved('');
      assert.deepEqual(result, []);
    });

    test('handles underscore and digit in variable names', () => {
      const result = extractUnresolved('{{var_1}}{{VAR_2}}');
      assert.deepEqual(result, ['{{var_1}}', '{{VAR_2}}']);
    });
  });
});
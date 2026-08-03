import { strict as assert } from 'assert';

suite('message protocol integration', () => {
  suite('IMessage type structure', () => {
    test('sendRequest message has correct structure', () => {
      const msg = {
        command: 'sendRequest' as const,
        payload: {
          request: {
            id: '123',
            name: 'Test',
            method: 'GET' as const,
            url: 'https://example.com',
            headers: [],
            queryParams: [],
            body: { type: 'none' as const },
            auth: { type: 'none' as const },
            proxy: { enabled: false, host: '', port: 0 },
            settings: { timeout: 30000, sslVerify: true, followRedirects: true, maxRedirects: 5 },
          },
          variables: { variables: [] },
        },
      };
      assert.equal(msg.command, 'sendRequest');
      assert.ok(msg.payload.request.id);
      assert.equal(msg.payload.variables.variables.length, 0);
    });

    test('error message has code and message', () => {
      const msg = {
        command: 'error' as const,
        payload: {
          code: 'NETWORK_ERROR',
          message: 'Could not connect',
        },
      };
      assert.equal(msg.command, 'error');
      assert.equal(msg.payload.code, 'NETWORK_ERROR');
      assert.ok(msg.payload.message.length > 0);
    });

    test('historyLoaded message has entries array', () => {
      const msg = {
        command: 'historyLoaded' as const,
        payload: {
          entries: [
            {
              id: '1',
              request: {} as never,
              response: {} as never,
              createdAt: Date.now(),
            },
          ],
        },
      };
      assert.equal(msg.command, 'historyLoaded');
      assert.equal(msg.payload.entries.length, 1);
    });

    test('settingsLoaded message has settings, proxy, and defaultHeaders', () => {
      const msg = {
        command: 'settingsLoaded' as const,
        payload: {
          settings: {
            timeout: 30000,
            sslVerify: true,
            followRedirects: true,
            maxRedirects: 5,
          },
          proxy: { enabled: false, host: '', port: 0 },
          defaultHeaders: [],
        },
      };
      assert.equal(msg.command, 'settingsLoaded');
      assert.equal(msg.payload.settings.timeout, 30000);
      assert.equal(msg.payload.proxy.enabled, false);
    });

    test('proxiesLoaded message carries the saved profile set', () => {
      const msg = {
        command: 'proxiesLoaded' as const,
        payload: {
          proxies: {
            profiles: [
              { id: 'p1', name: 'Corporate', host: 'proxy.example.com', port: 8080 },
            ],
          },
        },
      };
      assert.equal(msg.command, 'proxiesLoaded');
      assert.equal(msg.payload.proxies.profiles.length, 1);
      assert.equal(msg.payload.proxies.profiles[0].port, 8080);
    });

    test('copyCurl message has request and variables', () => {
      const msg = {
        command: 'copyCurl' as const,
        payload: {
          request: { id: '1', name: 'Test', method: 'GET' as const, url: 'https://example.com', headers: [], queryParams: [], body: { type: 'none' as const }, auth: { type: 'none' as const }, proxy: { enabled: false, host: '', port: 0 }, settings: { timeout: 30000, sslVerify: true, followRedirects: true, maxRedirects: 5 } },
          variables: { variables: [] },
        },
      };
      assert.equal(msg.command, 'copyCurl');
      assert.ok(msg.payload.request);
      assert.ok(msg.payload.variables);
    });
  });
});
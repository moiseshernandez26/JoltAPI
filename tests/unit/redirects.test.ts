import { strict as assert } from 'assert';
import { isRedirectStatus, nextRedirectStep } from '../../src/services/redirects';
import type { IRedirectStep } from '../../src/services/redirects';

function step(overrides: Partial<IRedirectStep> = {}): IRedirectStep {
  return {
    url: 'https://api.example.com/a',
    method: 'GET',
    headers: { Authorization: 'Bearer secret', Accept: 'application/json' },
    ...overrides,
  };
}

suite('redirects', () => {
  suite('isRedirectStatus', () => {
    test('recognizes the five redirect codes', () => {
      for (const code of [301, 302, 303, 307, 308]) {
        assert.equal(isRedirectStatus(code), true, `${code} should be a redirect`);
      }
    });

    test('rejects non-redirects', () => {
      for (const code of [200, 201, 204, 300, 304, 400, 404, 500]) {
        assert.equal(isRedirectStatus(code), false, `${code} should not be a redirect`);
      }
    });
  });

  suite('nextRedirectStep', () => {
    test('resolves a relative Location against the current URL', () => {
      const next = nextRedirectStep(step(), 302, '/b');
      assert.equal(next?.url, 'https://api.example.com/b');
    });

    test('accepts an absolute Location', () => {
      const next = nextRedirectStep(step(), 302, 'https://other.example.com/x');
      assert.equal(next?.url, 'https://other.example.com/x');
    });

    test('returns null when there is no Location header', () => {
      assert.equal(nextRedirectStep(step(), 302, null), null);
    });

    // `new URL(location, base)` treats junk as a relative path rather than throwing, which
    // is standard URL semantics. That's safe here: it stays on the current origin, so the
    // worst case is one wasted hop to a 404 — never a jump to an attacker-named host.
    test('a malformed Location degrades to a same-origin path, not a cross-origin jump', () => {
      const next = nextRedirectStep(step(), 302, 'ht tp://%%%');
      assert.equal(new URL(next!.url).origin, 'https://api.example.com');
    });

    test('returns null when the current URL itself cannot be parsed', () => {
      assert.equal(nextRedirectStep(step({ url: 'not a url' }), 302, '/b'), null);
    });

    // A redirect target is chosen by the remote server, so forwarding credentials to a
    // different origin would hand a bearer token to a host the user never named.
    test('strips Authorization/Cookie when the origin changes', () => {
      const next = nextRedirectStep(
        step({ headers: { Authorization: 'Bearer secret', Cookie: 'sid=1', Accept: 'application/json' } }),
        302,
        'https://evil.example.net/x',
      );
      assert.equal(next?.headers.Authorization, undefined);
      assert.equal(next?.headers.Cookie, undefined);
      assert.equal(next?.headers.Accept, 'application/json');
    });

    test('keeps credentials on a same-origin redirect', () => {
      const next = nextRedirectStep(step(), 302, '/b');
      assert.equal(next?.headers.Authorization, 'Bearer secret');
    });

    test('303 downgrades any method to GET and drops the body', () => {
      const next = nextRedirectStep(
        step({ method: 'POST', body: '{"a":1}', headers: { 'Content-Type': 'application/json' } }),
        303,
        '/done',
      );
      assert.equal(next?.method, 'GET');
      assert.equal(next?.body, undefined);
      assert.equal(next?.headers['Content-Type'], undefined);
    });

    test('301/302 downgrade POST to GET, matching browsers and curl', () => {
      for (const code of [301, 302]) {
        const next = nextRedirectStep(step({ method: 'POST', body: 'x' }), code, '/b');
        assert.equal(next?.method, 'GET', `status ${code}`);
        assert.equal(next?.body, undefined, `status ${code}`);
      }
    });

    test('307/308 preserve the method and body', () => {
      for (const code of [307, 308]) {
        const next = nextRedirectStep(step({ method: 'POST', body: '{"a":1}' }), code, '/b');
        assert.equal(next?.method, 'POST', `status ${code}`);
        assert.equal(next?.body, '{"a":1}', `status ${code}`);
      }
    });

    test('a GET is never downgraded and keeps its (absent) body', () => {
      const next = nextRedirectStep(step(), 301, '/b');
      assert.equal(next?.method, 'GET');
      assert.equal(next?.body, undefined);
    });
  });
});

import { strict as assert } from 'assert';
// Imported from `exportUtils`, not `exportService`: the latter now writes through
// `vscode.workspace.fs` and cannot be loaded outside the extension host.
import { collectReferencedProxies } from '../../src/services/exportUtils';
import type { ICollection, IHttpRequest, IProxyProfile } from '../../src/models';

function makeCollection(proxyIds: (string | undefined)[]): ICollection {
  const now = Date.now();
  return {
    id: 'c1',
    name: 'Test',
    createdAt: now,
    updatedAt: now,
    requests: proxyIds.map((proxyId, i) => ({
      id: `r${i}`,
      name: `Request ${i}`,
      createdAt: now,
      updatedAt: now,
      request: {
        id: `r${i}`,
        name: `Request ${i}`,
        method: 'GET',
        url: 'https://api.example.com',
        headers: [],
        queryParams: [],
        body: { type: 'none' },
        auth: { type: 'none' },
        proxyId,
        settings: { timeout: 30000, sslVerify: true, followRedirects: true, maxRedirects: 5 },
      } satisfies IHttpRequest,
    })),
  };
}

const PROFILES: IProxyProfile[] = [
  { id: 'p1', name: 'Corp', host: 'proxy.example.com', port: 8080, auth: { username: 'bob', password: 'pw' } },
  { id: 'p2', name: 'Unused', host: 'other.example.com', port: 3128 },
];

suite('exportService — referenced proxy profiles', () => {
  test('exports only the profiles the collection actually references', () => {
    const result = collectReferencedProxies(makeCollection(['p1', undefined]), PROFILES);
    assert.equal(result.length, 1);
    assert.equal(result[0].id, 'p1');
  });

  // An export is a file people share — proxy credentials must not ride along in it.
  test('strips credentials from exported profiles', () => {
    const result = collectReferencedProxies(makeCollection(['p1']), PROFILES);
    assert.equal(result[0].auth, undefined);
    assert.equal(result[0].host, 'proxy.example.com');
    assert.equal(result[0].port, 8080);
  });

  test('returns nothing when no request uses a proxy', () => {
    assert.deepEqual(collectReferencedProxies(makeCollection([undefined, undefined]), PROFILES), []);
  });

  test('ignores proxyIds with no matching profile', () => {
    assert.deepEqual(collectReferencedProxies(makeCollection(['gone']), PROFILES), []);
  });

  test('deduplicates when several requests share one proxy', () => {
    const result = collectReferencedProxies(makeCollection(['p1', 'p1', 'p1']), PROFILES);
    assert.equal(result.length, 1);
  });
});

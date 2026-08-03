import type { ICollection, IProxyProfile } from '../models';

/**
 * Pure helpers for building an export payload.
 *
 * Deliberately free of any `vscode` import so it can be unit tested with plain node/mocha —
 * `exportService.ts` itself now writes through `vscode.workspace.fs` and can only run inside
 * the extension host. Same split as `httpService` ↔ `curlUtils`/`httpErrors`.
 */

/**
 * Picks the proxy profiles referenced by a collection's requests, **with credentials
 * stripped**.
 *
 * Requests store only a `proxyId`, so without this the export lands in another workspace
 * with dangling references and every proxied request fails as "proxy no longer exists".
 * Auth is dropped on purpose: an export is a file people mail around, and a proxy password
 * is not something to ship inside it — the importer re-enters it once.
 */
export function collectReferencedProxies(
  collection: ICollection,
  profiles: IProxyProfile[],
): IProxyProfile[] {
  const referenced = new Set(
    collection.requests
      .map((r) => r.request.proxyId)
      .filter((id): id is string => !!id),
  );

  return profiles
    .filter((p) => referenced.has(p.id))
    .map(({ auth: _auth, ...rest }) => rest);
}

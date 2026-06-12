import type { ICollection, ICollectionRequest, IHttpRequest, HttpMethod, AuthType } from '../models';

interface PostmanCollection {
  info: { name: string; _postman_id?: string; description?: string };
  item: PostmanItem[];
}

interface PostmanItem {
  name: string;
  request?: {
    method?: string;
    url?: string | { raw?: string };
    header?: { key: string; value: string; disabled?: boolean }[];
    body?: {
      mode?: string;
      raw?: string;
      formdata?: { key: string; value: string; disabled?: boolean; type: string }[];
    };
  };
  item?: PostmanItem[];
}

export function isPostmanCollection(data: unknown): data is PostmanCollection {
  const d = data as Record<string, unknown>;
  return !!(d && d.info && typeof d.info === 'object' && (d.info as Record<string, unknown>).name && Array.isArray(d.item));
}

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function convertPostmanToCollection(pm: PostmanCollection): ICollection {
  const now = Date.now();
  const requests = convertPostmanItems(pm.item, now);

  return {
    id: generateId(),
    name: pm.info.name,
    requests,
    createdAt: now,
    updatedAt: now,
  };
}

function convertPostmanItems(items: PostmanItem[], now: number): ICollectionRequest[] {
  const result: ICollectionRequest[] = [];

  for (const item of items) {
    if (item.item) {
      result.push(...convertPostmanItems(item.item, now));
    } else if (item.request) {
      const req = item.request;
      const method = ((req.method ?? 'GET').toUpperCase()) as HttpMethod;
      const url = typeof req.url === 'string' ? req.url : (req.url?.raw ?? '');

      const headers = (req.header ?? [])
        .filter((h) => h.key)
        .map((h, i) => ({
          id: `pm-h-${i}-${generateId()}`,
          key: h.key,
          value: h.value,
          enabled: !h.disabled,
        }));

      let body: IHttpRequest['body'] = { type: 'none' };
      if (req.body) {
        if (req.body.mode === 'raw' && req.body.raw) {
          body = { type: 'raw', rawBody: req.body.raw };
        } else if (req.body.mode === 'urlencoded' && req.body.formdata) {
          body = {
            type: 'form-data',
            formData: req.body.formdata
              .filter((f) => f.key)
              .map((f, i) => ({
                id: `pm-fd-${i}-${generateId()}`,
                key: f.key,
                value: f.value,
                enabled: !f.disabled,
              })),
          };
        } else if (req.body.mode === 'raw' && !req.body.raw) {
          body = { type: 'none' };
        } else if (req.body.raw) {
          body = { type: 'json', jsonBody: req.body.raw };
        }
      }

      result.push({
        id: generateId(),
        name: item.name,
        request: {
          id: generateId(),
          name: item.name,
          method,
          url,
          headers,
          queryParams: [],
          body,
          auth: { type: 'none' } as { type: AuthType },
          proxy: { enabled: false, host: '', port: 0 },
          settings: {
            timeout: 30000,
            sslVerify: true,
            followRedirects: true,
            maxRedirects: 5,
          },
        },
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  return result;
}

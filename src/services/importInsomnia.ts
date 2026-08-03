import type { ICollection, ICollectionRequest, IHttpRequest, HttpMethod, AuthType } from '../models';

interface InsomniaExport {
  _type: string;
  resources: InsomniaResource[];
}

interface InsomniaResource {
  name: string;
  method: string;
  url: string;
  headers?: { name: string; value: string }[];
  body?: { text?: string; mimeType?: string };
}

export function isInsomniaExport(data: unknown): data is InsomniaExport {
  const d = data as Record<string, unknown>;
  return !!(d && d._type === 'export' && Array.isArray(d.resources));
}

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function convertInsomniaToCollection(insomnia: InsomniaExport): ICollection {
  const now = Date.now();
  const requests = insomnia.resources.map((res) => {
    const method = ((res.method ?? 'GET').toUpperCase()) as HttpMethod;
    const headers = (res.headers ?? []).map((h, i) => ({
      id: `ins-h-${i}-${generateId()}`,
      key: h.name,
      value: h.value,
      enabled: true,
    }));

    let body: IHttpRequest['body'] = { type: 'none' };
    if (res.body?.text) {
      const mimeType = res.body.mimeType ?? '';
      if (mimeType.includes('json')) {
        body = { type: 'json', jsonBody: res.body.text };
      } else if (mimeType.includes('x-www-form-urlencoded')) {
        body = { type: 'form-data', formData: [] };
      } else {
        body = { type: 'raw', rawBody: res.body.text };
      }
    }

    return {
      id: generateId(),
      name: res.name || res.url,
      request: {
        id: generateId(),
        name: res.name || res.url,
        method,
        url: res.url,
        headers,
        queryParams: [],
        body,
        auth: { type: 'none' } as { type: AuthType },
        settings: {
          timeout: 30000,
          sslVerify: true,
          followRedirects: true,
          maxRedirects: 5,
        },
      },
      createdAt: now,
      updatedAt: now,
    };
  });

  return {
    id: generateId(),
    name: 'Imported from Insomnia',
    requests,
    createdAt: now,
    updatedAt: now,
  };
}

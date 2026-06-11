import type { IHttpRequest } from '../types';

export function generateRequestName(request: IHttpRequest): string {
  const method = request.method;
  let hostname = '';

  try {
    const url = new URL(request.url);
    hostname = url.hostname.replace(/\./g, '_');
  } catch {
    hostname = request.url.split('/')[2]?.replace(/\./g, '_') || 'unknown';
  }

  return `${hostname}_${method}`;
}
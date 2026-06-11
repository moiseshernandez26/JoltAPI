import type { IHttpRequest } from '../types';

export function generateRequestName(request: IHttpRequest): string {
  try {
    const url = new URL(request.url);
    const hostParts = url.hostname.split('.');
    const hostPart = hostParts[0];
    if (!hostPart.includes('{{')) {
      return hostPart;
    }
    const pathParts = url.pathname.split('/').filter(Boolean);
    if (pathParts.length > 0 && !pathParts[0].includes('{{')) {
      return pathParts[0];
    }
    return 'request';
  } catch {
    return 'request';
  }
}

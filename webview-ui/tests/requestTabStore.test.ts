import { describe, test, expect, beforeEach } from 'vitest';
import { useTabStore } from '../src/store/requestTabStore';
import { createDefaultRequest } from '../src/store/requestStore';
import type { IHttpRequest } from '../src/types';

function makeRequest(overrides: Partial<IHttpRequest> = {}): IHttpRequest {
  return {
    ...createDefaultRequest(),
    ...overrides,
  };
}

beforeEach(() => {
  useTabStore.getState().closeAllTabs();
});

describe('requestTabStore', () => {
  test('a freshly created tab carries a full default request, not a stub', () => {
    const tab = useTabStore.getState().tabs[0];
    expect(tab.request).toBeDefined();
    expect(tab.request.headers).toBeDefined();
    expect(tab.request.body).toEqual({ type: 'none' });
    expect(tab.request.auth).toEqual({ type: 'none' });
  });

  test('addPrepopulatedTab stores the full request (headers, body, auth), not just name/method/url', () => {
    const request = makeRequest({
      name: 'Get user',
      method: 'POST',
      url: 'https://api.example.com/users',
      headers: [{ id: 'h1', key: 'X-Custom', value: 'v', enabled: true }],
      body: { type: 'json', jsonBody: '{"a":1}' },
      auth: { type: 'bearer', bearerToken: 'tok' },
    });

    useTabStore.getState().addPrepopulatedTab(request, true);

    const { tabs, activeTabIndex } = useTabStore.getState();
    const newTab = tabs[activeTabIndex];
    expect(newTab.name).toBe('Get user');
    expect(newTab.method).toBe('POST');
    expect(newTab.fromCollection).toBe(true);
    // The regression this guards: tabs used to only remember name/method/url.
    expect(newTab.request.headers).toEqual(request.headers);
    expect(newTab.request.body).toEqual(request.body);
    expect(newTab.request.auth).toEqual(request.auth);
  });

  test('switching away from a tab and back preserves that tab\'s headers/body/auth', () => {
    // Tab 0 (default) gets edited in place, simulating the RequestTabBar sync effect
    // that fires on every currentRequest change while a tab is active.
    const tab0Edited = makeRequest({
      url: 'https://api.example.com/a',
      headers: [{ id: 'h1', key: 'A', value: '1', enabled: true }],
    });
    useTabStore.getState().updateTab(0, {
      url: tab0Edited.url,
      request: tab0Edited,
    });

    // Open a second tab with different data — this is now the active tab.
    const tab1Request = makeRequest({
      url: 'https://api.example.com/b',
      headers: [{ id: 'h2', key: 'B', value: '2', enabled: true }],
    });
    useTabStore.getState().addPrepopulatedTab(tab1Request, true);

    // Switching back to tab 0 must restore its own headers, not a blank stub
    // and not tab 1's headers.
    const tab0 = useTabStore.getState().tabs[0];
    expect(tab0.request.headers).toEqual(tab0Edited.headers);
    expect(tab0.request.url).toBe('https://api.example.com/a');

    const tab1 = useTabStore.getState().tabs[1];
    expect(tab1.request.headers).toEqual(tab1Request.headers);
  });

  test('updateTab merges a partial update without discarding the stored request', () => {
    useTabStore.getState().updateTab(0, { name: 'Renamed' });
    const tab = useTabStore.getState().tabs[0];
    expect(tab.name).toBe('Renamed');
    expect(tab.request).toBeDefined();
  });
});

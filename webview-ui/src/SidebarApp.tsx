import React, { useEffect } from 'react';
import { useSidebarStore } from './sidebar/sidebarStore';
import { useMessageListener } from './hooks/useMessageListener';
import { useSendMessage } from './hooks/useSendMessage';
import { CollectionsPanel } from './sidebar/CollectionsPanel';
import { HistoryPanel } from './sidebar/HistoryPanel';
import { VariablesPanel } from './sidebar/VariablesPanel';
import type { HostToWebviewMessage, IHttpRequest } from './types';

function createEmptyRequest(): IHttpRequest {
  return {
    id: crypto.randomUUID(),
    name: 'Untitled Request',
    method: 'GET',
    url: '',
    headers: [{ id: crypto.randomUUID(), key: '', value: '', enabled: true }],
    queryParams: [],
    body: { type: 'none' },
    auth: { type: 'none' },
    proxy: { enabled: false, host: '', port: 0 },
    settings: { timeout: 30000, sslVerify: true, followRedirects: true, maxRedirects: 5 },
  };
}

export const SidebarApp: React.FC = () => {
  const activeTab = useSidebarStore((s) => s.activeTab);
  const setActiveTab = useSidebarStore((s) => s.setActiveTab);
  const setCollections = useSidebarStore((s) => s.setCollections);
  const setHistory = useSidebarStore((s) => s.setHistory);
  const setVariables = useSidebarStore((s) => s.setVariables);
  const setIsLoading = useSidebarStore((s) => s.setIsLoading);
  const sendMessage = useSendMessage();

  useMessageListener((message: HostToWebviewMessage) => {
    switch (message.command) {
      case 'collectionsLoaded':
        setCollections(message.payload.collections);
        setIsLoading(false);
        break;
      case 'historyLoaded':
        setHistory(message.payload.entries);
        break;
      case 'variablesLoaded':
        setVariables(message.payload.variables.variables);
        break;
      case 'error':
        console.error('[JoltAPI Sidebar] Error:', message.payload.message);
        break;
    }
  });

  useEffect(() => {
    sendMessage({ command: 'loadCollections', payload: undefined });
    sendMessage({ command: 'getHistory', payload: undefined });
    sendMessage({ command: 'loadVariables', payload: undefined });
  }, [sendMessage]);

  const handleNewRequest = (): void => {
    sendMessage({ command: 'openInPanel', payload: { request: createEmptyRequest() } });
  };

  const tabs: { id: SidebarTab; label: string }[] = [
    { id: 'collections', label: 'Collections' },
    { id: 'history', label: 'History' },
    { id: 'variables', label: 'Variables' },
  ];

  return (
    <div style={styles.container}>
      <div style={styles.actions}>
        <button onClick={handleNewRequest} style={styles.newReqBtn} title="New Request">
          + New Request
        </button>
      </div>
      <div style={styles.tabBar}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              ...styles.tab,
              ...(activeTab === tab.id ? styles.activeTab : {}),
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div style={styles.content}>
        {activeTab === 'collections' && <CollectionsPanel />}
        {activeTab === 'history' && <HistoryPanel />}
        {activeTab === 'variables' && <VariablesPanel />}
      </div>
    </div>
  );
};

type SidebarTab = 'collections' | 'history' | 'variables';

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    fontSize: '12px',
  },
  actions: {
    padding: '6px 8px',
    borderBottom: '1px solid var(--vscode-panel-border)',
    flexShrink: 0,
  },
  newReqBtn: {
    width: '100%',
    padding: '5px 8px',
    fontSize: '11px',
    fontWeight: 600,
    background: 'var(--vscode-button-background)',
    color: 'var(--vscode-button-foreground)',
    border: 'none',
    borderRadius: '2px',
    cursor: 'pointer',
  },
  tabBar: {
    display: 'flex',
    borderBottom: '1px solid var(--vscode-panel-border)',
    flexShrink: 0,
  },
  tab: {
    flex: 1,
    padding: '6px 4px',
    fontSize: '11px',
    fontWeight: 500,
    border: 'none',
    background: 'none',
    color: 'var(--vscode-sideBarTitle-foreground)',
    cursor: 'pointer',
    borderBottom: '2px solid transparent',
    transition: 'border-color 0.15s',
  },
  activeTab: {
    borderBottomColor: 'var(--vscode-focusBorder)',
    color: 'var(--vscode-sideBar-foreground)',
  },
  content: {
    flex: 1,
    overflow: 'auto',
    padding: '4px 0',
  },
};

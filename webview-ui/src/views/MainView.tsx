import React, { useState, useEffect } from 'react';
import {
  useRequestStore,
  useResponseStore,
  useCollectionStore,
  useVariableStore,
  useTabStore,
} from '../store';
import { useMessageListener, useRequestState } from '../hooks';
import { SaveRequestDialog } from '../components';
import { RequestBuilder, formatRequestHeaders } from './RequestBuilder';
import { ResponseView } from './ResponseView';
import { RequestTabBar } from '../components';
import type { HostToWebviewMessage } from '../types';

export const MainView: React.FC = () => {
  const currentRequest = useRequestStore((s) => s.currentRequest);
  const isSending = useRequestStore((s) => s.isSending);
  const setIsSending = useRequestStore((s) => s.setIsSending);
  const setResponse = useResponseStore((s) => s.setResponse);
  const setCollections = useCollectionStore((s) => s.setCollections);
  const setVariableSet = useVariableStore((s) => s.setVariableSet);
  const variables = useVariableStore((s) => s.variables);
  const { sendRequest } = useRequestState();

  const [lastError, setLastError] = useState<string | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  useMessageListener((message: HostToWebviewMessage) => {
    switch (message.command) {
      case 'responseReceived':
        setResponse(message.payload.response);
        setLastError(null);
        setIsSending(false);
        break;
      case 'collectionsLoaded':
        setCollections(message.payload.collections);
        break;
      case 'variablesLoaded':
        setVariableSet(message.payload.variables);
        break;
      case 'openRequest': {
        const req = message.payload.request;
        useRequestStore.getState().loadRequest(req);
        const tabStore = useTabStore.getState();
        tabStore.updateTab(tabStore.activeTabIndex, {
          name: req.name || req.url || 'Untitled',
          method: req.method,
          url: req.url,
        });
        break;
      }
      case 'error':
        console.error('[JoltAPI] Error:', message.payload.message);
        setLastError(message.payload.message);
        setIsSending(false);
        break;
      default:
        break;
    }
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        sendRequest();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [sendRequest]);

  return (
    <div style={styles.container}>
      <main style={styles.main}>
        <RequestTabBar />
        <RequestBuilder
          isSending={isSending}
          onSend={sendRequest}
          onSave={() => setShowSaveDialog(true)}
        />

        <ResponseView
          currentResponse={useResponseStore((s) => s.currentResponse)}
          lastError={lastError}
          isSending={isSending}
          onDismissError={() => setLastError(null)}
          currentRequest={currentRequest}
          variables={variables}
          formatRequestHeaders={formatRequestHeaders}
        />
      </main>

      {showSaveDialog && <SaveRequestDialog onClose={() => setShowSaveDialog(false)} />}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex', height: '100vh',
    fontFamily: 'var(--vscode-font-family, sans-serif)',
    color: 'var(--vscode-editor-foreground)',
    backgroundColor: 'var(--vscode-editor-background)',
  },
  main: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 },
};
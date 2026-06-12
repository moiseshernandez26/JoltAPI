import React, { useState, useEffect } from 'react';
import {
  useRequestStore,
  useResponseStore,
  useCollectionStore,
  useVariableStore,
  useTabStore,
} from '../store';
import { useMessageListener, useRequestState } from '../hooks';
import { postMessage } from '../api';
import { SaveRequestDialog } from '../components';
import { RequestBuilder, formatRequestHeaders } from './RequestBuilder';
import { ResponseView } from './ResponseView';
import { RequestTabBar } from '../components';
import type { HostToWebviewMessage, ICollection } from '../types';

export const MainView: React.FC = () => {
  const currentRequest = useRequestStore((s) => s.currentRequest);
  const isSending = useRequestStore((s) => s.isSending);
  const setIsSending = useRequestStore((s) => s.setIsSending);
  const setResponse = useResponseStore((s) => s.setResponse);
  const setCollections = useCollectionStore((s) => s.setCollections);
  const setVariableSet = useVariableStore((s) => s.setVariableSet);
  const variables = useVariableStore((s) => s.variables);
  const currentResponse = useResponseStore((s) => s.currentResponse);
  const { sendRequest } = useRequestState();

  const [lastError, setLastError] = useState<string | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  // Load collections and variables on mount
  useEffect(() => {
    postMessage({ command: 'loadCollections', payload: undefined });
    postMessage({ command: 'loadVariables', payload: undefined });
  }, []);

  const syncTabs = (collections: ICollection[]): void => {
    const tabStore = useTabStore.getState();
    const requestStore = useRequestStore.getState();

    const nameMap = new Map<string, string>();
    for (const c of collections) {
      for (const cr of c.requests) {
        nameMap.set(`${cr.request.method}::${cr.request.url}`, cr.name);
      }
    }

    const updatedTabs = tabStore.tabs
      .map((tab) => {
        if (!tab.url) {return tab;}
        const key = `${tab.method}::${tab.url}`;
        const collectionName = nameMap.get(key);
        if (collectionName && collectionName !== tab.name) {
          if (tabStore.activeTabIndex === tabStore.tabs.indexOf(tab)) {
            requestStore.setName(collectionName);
          }
          return { ...tab, name: collectionName };
        }
        return tab;
      })
      .filter((tab) => {
        if (!tab.fromCollection) {return true;}
        if (!tab.url) {return true;}
        const key = `${tab.method}::${tab.url}`;
        return nameMap.has(key);
      });

    if (updatedTabs.length === 0) {
      useTabStore.setState({ tabs: [{ id: 'default', name: 'Untitled', method: 'GET', url: '', fromCollection: false }], activeTabIndex: 0 });
      requestStore.resetRequest();
      return;
    }

    let newActiveIndex = tabStore.activeTabIndex;
    if (newActiveIndex >= updatedTabs.length) {
      newActiveIndex = updatedTabs.length - 1;
    }

    const removedTabs = tabStore.tabs.length - updatedTabs.length;
    if (removedTabs > 0 && updatedTabs.length > 0) {
      const newTab = updatedTabs[newActiveIndex];
      requestStore.loadRequest({
        id: newTab.id,
        name: newTab.name,
        method: newTab.method,
        url: newTab.url,
        headers: [],
        queryParams: [],
        body: { type: 'none' },
        auth: { type: 'none' },
        proxy: { enabled: false, host: '', port: 0 },
        settings: { timeout: 30000, sslVerify: true, followRedirects: true, maxRedirects: 5 },
      });
    }

    useTabStore.setState({ tabs: updatedTabs, activeTabIndex: newActiveIndex });
  };

  useMessageListener((message: HostToWebviewMessage) => {
    switch (message.command) {
      case 'responseReceived':
        setResponse(message.payload.response);
        setLastError(null);
        setIsSending(false);
        break;
      case 'collectionsLoaded':
        setCollections(message.payload.collections);
        syncTabs(message.payload.collections);
        break;
      case 'variablesLoaded':
        setVariableSet(message.payload.variables);
        break;
      case 'openRequest': {
        const req = message.payload.request;
        const tabStore = useTabStore.getState();
        const requestState = useRequestStore.getState();
        const tabName = req.name || req.url || 'Untitled';
        const fromCollection = !!req.url;

        // If request is already open in a tab, switch to it
        if (req.url) {
          const existingIndex = tabStore.tabs.findIndex(
            (tab) => tab.url === req.url && tab.method === req.method
          );
          if (existingIndex !== -1) {
            tabStore.setActiveTab(existingIndex);
            requestState.loadRequest(req);
            tabStore.updateTab(existingIndex, {
              name: tabName,
              method: req.method,
              url: req.url,
              fromCollection,
            });
            break;
          }
        } else {
          // Empty request from "Open App" — reuse existing empty tab if present
          const emptyIndex = tabStore.tabs.findIndex((tab) => !tab.url);
          if (emptyIndex !== -1) {
            tabStore.setActiveTab(emptyIndex);
            requestState.loadRequest(req);
            break;
          }
        }

        // Always open a new tab (unless at limit, then reuse current)
        if (tabStore.tabs.length >= 10) {
          requestState.loadRequest(req);
          tabStore.updateTab(tabStore.activeTabIndex, {
            name: tabName,
            method: req.method,
            url: req.url,
            fromCollection,
          });
        } else {
          tabStore.addPrepopulatedTab(tabName, req.method, req.url);
          requestState.loadRequest(req);
        }
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
          currentResponse={currentResponse}
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
import React from 'react';
import {
  useRequestStore,
  useVariableStore,
} from '../store';
import { useSendMessage } from '../hooks';
import {
  RequestTabs,
  KeyValueEditor,
  BodyEditor,
  AuthEditor,
  UrlBar,
} from '../components';
import type { IHttpRequest } from '../types';
import { HEADER_SUGGESTIONS, HEADER_VALUE_SUGGESTIONS } from '../utils/requestHeaders';

interface RequestBuilderProps {
  isSending: boolean;
  onSend: () => void;
  onSave: () => void;
}

export const RequestBuilder: React.FC<RequestBuilderProps> = ({
  isSending,
  onSend,
  onSave,
}) => {
  const currentRequest = useRequestStore((s) => s.currentRequest);
  const activeTab = useRequestStore((s) => s.activeTab);
  const setActiveTab = useRequestStore((s) => s.setActiveTab);
  const setMethod = useRequestStore((s) => s.setMethod);
  const setUrl = useRequestStore((s) => s.setUrl);
  const variables = useVariableStore((s) => s.variables);

  return (
    <>
      <div style={styles.requestBar}>
        <select
          value={currentRequest.method}
          onChange={(e) => setMethod(e.target.value as typeof currentRequest.method)}
          style={styles.methodSelect}
        >
          <option>GET</option>
          <option>POST</option>
          <option>PUT</option>
          <option>PATCH</option>
          <option>DELETE</option>
          <option>HEAD</option>
          <option>OPTIONS</option>
        </select>
        <UrlBar
          value={currentRequest.url}
          onChange={(url) => setUrl(url)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {onSend();}
          }}
        />
        <button onClick={onSend} disabled={isSending} style={styles.sendButton}>
          {isSending ? 'Sending...' : 'Send'}
        </button>
        <button onClick={onSave} style={styles.saveButton} title="Save to Collection">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M2 2a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1H6.5L5 2H2zm10 1v1H4v9h8V3zm-5 2h2v2H7V5zm3 0h2v2h-2V5z" />
          </svg>
        </button>
      </div>

      <RequestTabs activeTab={activeTab} onTabChange={setActiveTab} />

      <div style={styles.editorArea}>
        {activeTab === 'params' && (
          <KeyValueEditor
            pairs={currentRequest.queryParams}
            onChange={(p) => useRequestStore.getState().setQueryParams(p)}
            keyPlaceholder="Parameter name"
            valuePlaceholder="Parameter value"
          />
        )}
        {activeTab === 'headers' && (
          <KeyValueEditor
            pairs={currentRequest.headers}
            onChange={(h) => useRequestStore.getState().setHeaders(h)}
            keyPlaceholder="Header name"
            valuePlaceholder="Header value"
            suggestions={HEADER_SUGGESTIONS}
            valueSuggestions={HEADER_VALUE_SUGGESTIONS}
          />
        )}
        {activeTab === 'body' && (
          <BodyEditor
            body={currentRequest.body}
            onChange={(b) => useRequestStore.getState().setBody(b)}
          />
        )}
        {activeTab === 'auth' && (
          <AuthEditor
            auth={currentRequest.auth}
            onChange={(a) => useRequestStore.getState().setAuth(a)}
          />
        )}
      </div>
    </>
  );
};

export { formatRequestHeaders } from '../utils/requestHeaders';

const styles: Record<string, React.CSSProperties> = {
  requestBar: {
    display: 'flex', padding: '12px', gap: '8px',
    borderBottom: '1px solid var(--vscode-panel-border)',
  },
  methodSelect: {
    padding: '6px 8px',
    backgroundColor: 'var(--vscode-input-background)',
    color: 'var(--vscode-input-foreground)',
    border: '1px solid var(--vscode-input-border)',
    borderRadius: '2px', fontSize: '13px', minWidth: '100px',
  },
  sendButton: {
    padding: '6px 20px',
    backgroundColor: 'var(--vscode-button-background)',
    color: 'var(--vscode-button-foreground)',
    border: 'none', borderRadius: '2px', cursor: 'pointer',
    fontSize: '13px', fontWeight: 'bold',
  },
  saveButton: {
    padding: '6px 12px',
    backgroundColor: 'var(--vscode-button-secondaryBackground)',
    color: 'var(--vscode-button-secondaryForeground)',
    border: 'none', borderRadius: '2px', cursor: 'pointer',
    fontSize: '12px',
  },
  editorArea: { flex: 1, overflow: 'auto', minHeight: '100px' },
};
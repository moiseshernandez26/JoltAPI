import React, { useState } from 'react';
import type { IHttpResponse, IHttpRequest, IVariable, IHttpResponseHeader } from '../types';
import { ResponseHeaders, ResponseBody, LoadingSpinner } from '../components';

interface ResponseViewProps {
  currentResponse: IHttpResponse | null;
  lastError: string | null;
  isSending: boolean;
  onDismissError: () => void;
  currentRequest: IHttpRequest;
  variables: IVariable[];
  formatRequestHeaders: (request: IHttpRequest, variables: IVariable[]) => IHttpResponseHeader[];
}

export const ResponseView: React.FC<ResponseViewProps> = ({
  currentResponse,
  lastError,
  isSending,
  onDismissError,
  currentRequest,
  variables,
  formatRequestHeaders,
}) => {
  const [responseTab, setResponseTab] = useState<'body' | 'headers'>('body');

  return (
    <div style={styles.responseArea}>
      {lastError ? (
        <div style={styles.errorBox}>
          <p style={styles.errorTitle}>Request Failed</p>
          <p style={styles.errorMessage}>{lastError}</p>
          <button onClick={onDismissError} style={styles.dismissBtn}>Dismiss</button>
        </div>
      ) : isSending ? (
        <LoadingSpinner />
      ) : currentResponse ? (
        <div style={styles.response}>
          <div style={styles.responseMeta}>
            <span style={styles.metaLabel}>Status</span>
            <span style={getStatusStyle(currentResponse.statusCode)}>
              {currentResponse.statusCode} {currentResponse.statusText}
            </span>
            <span style={styles.metaLabel}>Time</span>
            <span style={styles.metaItem}>{formatTime(currentResponse.responseTimeMs)}</span>
            <span style={styles.metaLabel}>Size</span>
            <span style={styles.metaItem}>{formatSize(currentResponse.responseSizeBytes)}</span>
          </div>

          <div style={styles.responseTabs}>
            {([
              ['body', 'Body'],
              ['headers', 'Headers'],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setResponseTab(key)}
                style={{
                  ...styles.responseTab,
                  ...(responseTab === key ? styles.activeResponseTab : {}),
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <div style={styles.responseContent}>
            <div style={{ display: responseTab === 'body' ? 'block' : 'none' }}>
              <ResponseBody body={currentResponse.body} contentType={currentResponse.contentType} />
            </div>
            <div style={{ display: responseTab === 'headers' ? 'block' : 'none' }}>
              <div>
                <p style={styles.sectionTitle}>Response Headers</p>
                <ResponseHeaders headers={currentResponse.headers} emptyMessage="No response headers." />
                <p style={styles.sectionTitle}>Request Headers</p>
                <ResponseHeaders headers={formatRequestHeaders(currentRequest, variables)} emptyMessage="No request headers." />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <p style={styles.noResponse}>No response yet. Send a request to see results.</p>
      )}
    </div>
  );
};

function getStatusStyle(code: number): React.CSSProperties {
  const color =
    code >= 200 && code < 300 ? '#4caf50'
    : code >= 300 && code < 400 ? '#2196f3'
    : code >= 400 && code < 500 ? '#ff9800'
    : '#f44336';
  return { color, fontWeight: 'bold', marginRight: '16px' };
}

function formatTime(ms: number): string {
  if (ms < 1000) {return `${Math.round(ms)}ms`;}
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) {return `${bytes}B`;}
  if (bytes < 1024 * 1024) {return `${(bytes / 1024).toFixed(1)}KB`;}
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

const styles: Record<string, React.CSSProperties> = {
  responseArea: {
    flex: 2, overflow: 'auto', padding: '12px',
    borderTop: '2px solid var(--vscode-panel-border)',
  },
  noResponse: {
    color: 'var(--vscode-descriptionForeground)', fontSize: '13px',
    textAlign: 'center', marginTop: '40px',
  },
  errorBox: {
    padding: '16px',
    backgroundColor: 'var(--vscode-inputValidation-errorBackground, rgba(255,0,0,0.1))',
    border: '1px solid var(--vscode-inputValidation-errorBorder, #f44336)',
    borderRadius: '4px',
    marginTop: '20px',
  },
  errorTitle: {
    fontSize: '14px', fontWeight: 'bold',
    color: 'var(--vscode-inputValidation-errorForeground, #f44336)',
    marginBottom: '8px',
  },
  errorMessage: {
    fontSize: '13px',
    color: 'var(--vscode-editor-foreground)',
    whiteSpace: 'pre-wrap', wordBreak: 'break-all',
    marginBottom: '12px',
  },
  dismissBtn: {
    padding: '4px 12px',
    backgroundColor: 'var(--vscode-button-secondaryBackground)',
    color: 'var(--vscode-button-secondaryForeground)',
    border: 'none', borderRadius: '2px', cursor: 'pointer', fontSize: '12px',
  },
  response: { display: 'flex', flexDirection: 'column', height: '100%' },
  responseMeta: {
    display: 'flex', alignItems: 'center', gap: '4px',
    paddingBottom: '8px',
    borderBottom: '1px solid var(--vscode-panel-border)',
    marginBottom: '8px', fontSize: '13px',
  },
  metaLabel: {
    fontSize: '10px',
    fontWeight: 'bold',
    color: 'var(--vscode-descriptionForeground)',
    textTransform: 'uppercase',
    marginRight: '2px',
  },
  metaItem: { marginRight: '16px', color: 'var(--vscode-descriptionForeground)' },
  responseContent: { flex: 1, overflow: 'auto' },
  responseTabs: {
    display: 'flex',
    borderBottom: '1px solid var(--vscode-panel-border)',
  },
  responseTab: {
    padding: '4px 12px',
    backgroundColor: 'transparent',
    color: 'var(--vscode-descriptionForeground)',
    border: 'none',
    borderBottom: '2px solid transparent',
    cursor: 'pointer',
    fontSize: '11px',
  },
  activeResponseTab: {
    color: 'var(--vscode-foreground)',
    borderBottomColor: 'var(--vscode-focusBorder)',
  },
  sectionTitle: {
    fontSize: '12px', fontWeight: 'bold',
    color: 'var(--vscode-foreground)', margin: '8px 0 4px 0',
  },
};
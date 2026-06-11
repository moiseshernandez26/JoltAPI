import React from 'react';
import { useSidebarStore } from './sidebarStore';
import { useSendMessage } from '../hooks/useSendMessage';
import type { IHttpRequest } from '../types';

export const HistoryPanel: React.FC = () => {
  const history = useSidebarStore((s) => s.history);
  const sendMessage = useSendMessage();

  const handleReplay = (request: IHttpRequest): void => {
    sendMessage({ command: 'openInPanel', payload: { request } });
  };

  const handleClear = (): void => {
    sendMessage({ command: 'clearHistory', payload: undefined });
  };

  return (
    <div>
      <div style={styles.header}>
        <button
          onClick={handleClear}
          disabled={history.length === 0}
          style={{
            ...styles.clearBtn,
            opacity: history.length === 0 ? 0.4 : 1,
          }}
        >
          Clear All
        </button>
        <button
          onClick={() => sendMessage({ command: 'getHistory', payload: undefined })}
          style={styles.refreshBtn}
          title="Refresh"
        >
          ↻
        </button>
      </div>

      {history.length === 0 && (
        <div style={styles.empty}>No request history yet. Send a request to see it here.</div>
      )}

      {history.map((entry) => (
        <div
          key={entry.id}
          style={styles.entry}
          onClick={() => handleReplay(entry.request)}
          title={`${entry.request.method} ${entry.request.url}`}
        >
          <div style={styles.entryTop}>
            <span style={{
              ...styles.method,
              color: getMethodColor(entry.request.method),
            }}>
              {entry.request.method}
            </span>
            <span style={styles.status}>
              {entry.response.statusCode}
            </span>
            <span style={styles.time}>
              {formatTime(entry.createdAt)}
            </span>
          </div>
          <div style={styles.url}>{truncateUrl(entry.request.url)}</div>
        </div>
      ))}
    </div>
  );
};

function getMethodColor(method: string): string {
  const colors: Record<string, string> = {
    GET: '#61affe', POST: '#49cc90', PUT: '#fca130',
    PATCH: '#50e3c2', DELETE: '#f93e3e', HEAD: '#9012fe',
    OPTIONS: '#0d5aa7',
  };
  return colors[method] ?? '#888';
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function truncateUrl(url: string): string {
  try {
    const u = new URL(url);
    let path = u.hostname + u.pathname;
    if (path.length > 40) {
      path = path.substring(0, 37) + '...';
    }
    return path;
  } catch {
    return url.length > 40 ? url.substring(0, 37) + '...' : url;
  }
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    display: 'flex',
    padding: '4px 8px',
    gap: '4px',
    borderBottom: '1px solid var(--vscode-panel-border)',
  },
  clearBtn: {
    flex: 1,
    padding: '4px 8px',
    fontSize: '11px',
    background: 'var(--vscode-button-secondaryBackground)',
    color: 'var(--vscode-button-secondaryForeground)',
    border: 'none',
    borderRadius: '2px',
    cursor: 'pointer',
  },
  refreshBtn: {
    padding: '4px 8px',
    background: 'none',
    border: 'none',
    color: 'var(--vscode-sideBarTitle-foreground)',
    cursor: 'pointer',
    fontSize: '14px',
  },
  entry: {
    padding: '6px 8px',
    cursor: 'pointer',
    borderBottom: '1px solid var(--vscode-panel-border)',
  },
  entryTop: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '2px',
  },
  method: {
    fontSize: '10px',
    fontWeight: 700,
  },
  status: {
    fontSize: '10px',
    color: 'var(--vscode-descriptionForeground)',
  },
  time: {
    fontSize: '10px',
    color: 'var(--vscode-descriptionForeground)',
    marginLeft: 'auto' as const,
  },
  url: {
    fontSize: '10px',
    color: 'var(--vscode-sideBarTitle-foreground)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  empty: {
    padding: '12px 8px',
    fontSize: '11px',
    color: 'var(--vscode-descriptionForeground)',
    textAlign: 'center' as const,
  },
};

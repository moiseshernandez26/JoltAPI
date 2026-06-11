import React, { useState } from 'react';
import type { IHttpResponseHeader } from '../types';

interface ResponseHeadersProps {
  headers: IHttpResponseHeader[];
  emptyMessage?: string;
}

/**
 * Collapsible response headers list.
 */
export const ResponseHeaders: React.FC<ResponseHeadersProps> = ({ headers, emptyMessage = 'No headers.' }) => {
  const [expanded, setExpanded] = useState(true);

  if (headers.length === 0) {
    return <p style={styles.empty}>{emptyMessage}</p>;
  }

  return (
    <div style={styles.container}>
      <button
        onClick={() => setExpanded(!expanded)}
        style={styles.toggle}
      >
        {expanded ? 'Hide' : 'Show'} Headers ({headers.length})
      </button>
      {expanded && (
        <table style={styles.table}>
          <tbody>
            {headers.map((h, i) => (
              <tr key={i} style={styles.row}>
                <td style={styles.keyCell}>{h.name}</td>
                <td style={styles.valueCell}>{h.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    marginBottom: '8px',
  },
  toggle: {
    padding: '4px 8px',
    backgroundColor: 'transparent',
    color: 'var(--vscode-textLink-foreground)',
    border: 'none',
    cursor: 'pointer',
    fontSize: '12px',
    marginBottom: '4px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  row: {
    borderBottom: '1px solid var(--vscode-panel-border)',
  },
  keyCell: {
    padding: '3px 8px',
    fontSize: '11px',
    fontWeight: 'bold',
    color: 'var(--vscode-foreground)',
    whiteSpace: 'nowrap',
    verticalAlign: 'top',
    width: '1%',
  },
  valueCell: {
    padding: '3px 8px',
    fontSize: '11px',
    color: 'var(--vscode-descriptionForeground)',
    wordBreak: 'break-all',
  },
  empty: {
    color: 'var(--vscode-descriptionForeground)',
    fontSize: '12px',
    fontStyle: 'italic',
  },
};

import React from 'react';
import type { IProxyConfig } from '../types';

interface ProxyEditorProps {
  proxy: IProxyConfig;
  onChange: (proxy: IProxyConfig) => void;
}

/**
 * Per-request proxy configuration. Overrides nothing globally — this only affects the
 * current request, useful for endpoints only reachable through a specific proxy while
 * everything else goes out directly. See `joltapi.proxy.*` settings for a workspace-wide
 * default (not yet read into new requests automatically).
 */
export const ProxyEditor: React.FC<ProxyEditorProps> = ({ proxy, onChange }) => {
  const handleAuthChange = (field: 'username' | 'password', value: string): void => {
    const currentAuth = proxy.auth ?? { username: '', password: '' };
    onChange({ ...proxy, auth: { ...currentAuth, [field]: value } });
  };

  return (
    <div style={styles.container}>
      <label style={styles.toggleRow}>
        <input
          type="checkbox"
          checked={proxy.enabled}
          onChange={(e) => onChange({ ...proxy, enabled: e.target.checked })}
          style={styles.checkbox}
        />
        <span>Use a proxy for this request</span>
      </label>

      {!proxy.enabled && (
        <p style={styles.hint}>
          This request is sent directly. Enable to route it through a proxy server —
          useful when an endpoint is only reachable through a corporate or local proxy.
        </p>
      )}

      {proxy.enabled && (
        <>
          <div style={styles.row}>
            <div style={{ ...styles.field, flex: 3 }}>
              <label style={styles.label}>Host</label>
              <input
                type="text"
                value={proxy.host}
                onChange={(e) => onChange({ ...proxy, host: e.target.value })}
                placeholder="proxy.example.com (no scheme)"
                style={styles.input}
              />
            </div>
            <div style={{ ...styles.field, flex: 1 }}>
              <label style={styles.label}>Port</label>
              <input
                type="number"
                value={proxy.port || ''}
                onChange={(e) => onChange({ ...proxy, port: Number(e.target.value) || 0 })}
                placeholder="8080"
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Username (optional)</label>
            <input
              type="text"
              value={proxy.auth?.username ?? ''}
              onChange={(e) => handleAuthChange('username', e.target.value)}
              placeholder="Proxy username"
              style={styles.input}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Password (optional)</label>
            <input
              type="password"
              value={proxy.auth?.password ?? ''}
              onChange={(e) => handleAuthChange('password', e.target.value)}
              placeholder="Proxy password"
              style={styles.input}
            />
          </div>

          <p style={styles.warning}>
            Proxy credentials are stored in plain text on disk if this request is saved to a
            collection. Do not store production credentials.
          </p>
        </>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '12px 8px',
  },
  toggleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    color: 'var(--vscode-foreground)',
    cursor: 'pointer',
    marginBottom: '10px',
  },
  checkbox: {
    margin: 0,
    cursor: 'pointer',
  },
  hint: {
    color: 'var(--vscode-descriptionForeground)',
    fontSize: '12px',
    fontStyle: 'italic',
  },
  row: {
    display: 'flex',
    gap: '8px',
  },
  field: {
    marginBottom: '10px',
  },
  label: {
    display: 'block',
    fontSize: '11px',
    color: 'var(--vscode-descriptionForeground)',
    marginBottom: '4px',
  },
  input: {
    width: '100%',
    padding: '6px 8px',
    backgroundColor: 'var(--vscode-input-background)',
    color: 'var(--vscode-input-foreground)',
    border: '1px solid var(--vscode-input-border)',
    borderRadius: '2px',
    fontSize: '12px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  warning: {
    fontSize: '11px',
    color: 'var(--vscode-inputValidation-warningForeground, #cca700)',
    backgroundColor: 'var(--vscode-inputValidation-warningBackground, rgba(204, 167, 0, 0.1))',
    padding: '4px 8px',
    borderRadius: '2px',
    marginTop: '4px',
  },
};

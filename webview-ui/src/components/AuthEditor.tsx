import React from 'react';
import type { IAuthConfig, AuthType } from '../types';

interface AuthEditorProps {
  auth: IAuthConfig;
  onChange: (auth: IAuthConfig) => void;
}

const AUTH_TYPES: { value: AuthType; label: string }[] = [
  { value: 'none', label: 'No Auth' },
  { value: 'bearer', label: 'Bearer Token' },
  { value: 'basic', label: 'Basic Auth' },
  { value: 'apiKey', label: 'API Key' },
];

/**
 * Auth preset editor.
 * Supports: None, Bearer Token, Basic Auth, API Key (header or query param).
 */
export const AuthEditor: React.FC<AuthEditorProps> = ({ auth, onChange }) => {
  const handleTypeChange = (type: AuthType): void => {
    onChange({ type });
  };

  return (
    <div style={styles.container}>
      <div style={styles.typeBar}>
        {AUTH_TYPES.map((at) => (
          <button
            key={at.value}
            onClick={() => handleTypeChange(at.value)}
            style={{
              ...styles.typeBtn,
              ...(auth.type === at.value ? styles.activeTypeBtn : {}),
            }}
          >
            {at.label}
          </button>
        ))}
      </div>

      <div style={styles.content}>
        {auth.type !== 'none' && (
          <p style={styles.warning}>
            Auth values are stored in plain text on disk. Do not store production credentials.
          </p>
        )}
        {auth.type === 'none' && (
          <p style={styles.hint}>No authentication will be sent with this request.</p>
        )}

        {auth.type === 'bearer' && (
          <div style={styles.field}>
            <label style={styles.label}>Token</label>
            <input
              type="password"
              value={auth.bearerToken ?? ''}
              onChange={(e) => onChange({ ...auth, bearerToken: e.target.value })}
              placeholder="Enter bearer token"
              style={styles.input}
            />
          </div>
        )}

        {auth.type === 'basic' && (
          <>
            <div style={styles.field}>
              <label style={styles.label}>Username</label>
              <input
                type="text"
                value={auth.basicUsername ?? ''}
                onChange={(e) => onChange({ ...auth, basicUsername: e.target.value })}
                placeholder="Username"
                style={styles.input}
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Password</label>
              <input
                type="password"
                value={auth.basicPassword ?? ''}
                onChange={(e) => onChange({ ...auth, basicPassword: e.target.value })}
                placeholder="Password"
                style={styles.input}
              />
            </div>
          </>
        )}

        {auth.type === 'apiKey' && (
          <>
            <div style={styles.field}>
              <label style={styles.label}>Key</label>
              <input
                type="text"
                value={auth.apiKeyName ?? ''}
                onChange={(e) => onChange({ ...auth, apiKeyName: e.target.value })}
                placeholder="X-API-Key"
                style={styles.input}
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Value</label>
              <input
                type="password"
                value={auth.apiKeyValue ?? ''}
                onChange={(e) => onChange({ ...auth, apiKeyValue: e.target.value })}
                placeholder="Enter API key value"
                style={styles.input}
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Add to</label>
              <select
                value={auth.apiKeyPlacement ?? 'header'}
                onChange={(e) =>
                  onChange({
                    ...auth,
                    apiKeyPlacement: e.target.value as 'header' | 'query',
                  })
                }
                style={styles.select}
              >
                <option value="header">Header</option>
                <option value="query">Query Parameter</option>
              </select>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '0',
  },
  typeBar: {
    display: 'flex',
    gap: '4px',
    padding: '8px 8px 0 8px',
    borderBottom: '1px solid var(--vscode-panel-border)',
  },
  typeBtn: {
    padding: '4px 12px',
    backgroundColor: 'transparent',
    color: 'var(--vscode-descriptionForeground)',
    border: 'none',
    borderBottom: '2px solid transparent',
    cursor: 'pointer',
    fontSize: '12px',
  },
  activeTypeBtn: {
    color: 'var(--vscode-foreground)',
    borderBottomColor: 'var(--vscode-focusBorder)',
  },
  content: {
    padding: '12px 8px',
  },
  hint: {
    color: 'var(--vscode-descriptionForeground)',
    fontSize: '12px',
    fontStyle: 'italic',
  },
  warning: {
    fontSize: '11px',
    color: 'var(--vscode-inputValidation-warningForeground, #cca700)',
    backgroundColor: 'var(--vscode-inputValidation-warningBackground, rgba(204, 167, 0, 0.1))',
    padding: '4px 8px',
    borderRadius: '2px',
    marginBottom: '10px',
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
  },
  select: {
    width: '100%',
    padding: '6px 8px',
    backgroundColor: 'var(--vscode-input-background)',
    color: 'var(--vscode-input-foreground)',
    border: '1px solid var(--vscode-input-border)',
    borderRadius: '2px',
    fontSize: '12px',
  },
};

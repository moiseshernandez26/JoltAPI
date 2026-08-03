import React, { useState } from 'react';
import { SecretInput } from '../components/SecretInput';
import { isValidPort, parseProxyHost, validateProxyHost } from '../utils/proxyHost';
import type { IProxyProfile } from '../types';

interface ProxyFormProps {
  /** Profile being edited, or undefined when adding a new one. */
  initial?: IProxyProfile;
  onSubmit: (profile: IProxyProfile) => void;
  onCancel: () => void;
}

/**
 * Add/edit form for a saved proxy. Kept separate from `ProxiesPanel` so the panel stays a
 * plain list — the form owns its own draft state and only reports a complete profile back.
 */
export const ProxyForm: React.FC<ProxyFormProps> = ({ initial, onSubmit, onCancel }) => {
  const [name, setName] = useState(initial?.name ?? '');
  const [host, setHost] = useState(initial?.host ?? '');
  const [port, setPort] = useState(initial ? String(initial.port) : '');
  const [username, setUsername] = useState(initial?.auth?.username ?? '');
  const [password, setPassword] = useState(initial?.auth?.password ?? '');

  const parsed = parseProxyHost(host);
  // A pasted `host:8080` fills the Port field for the user rather than corrupting the host.
  const portNumber = port.trim() ? Number(port) : (parsed.port ?? NaN);
  const hostError = host.trim() ? validateProxyHost(parsed.host) : null;
  // A password with no username would be silently dropped by the host's proxy agent.
  const authError = password && !username.trim()
    ? 'Add the username this password belongs to, or clear the password.'
    : null;
  const isValid =
    name.trim().length > 0 &&
    parsed.host.length > 0 &&
    !hostError &&
    !authError &&
    isValidPort(portNumber);

  /** Pulls a pasted `host:port` apart as soon as the user leaves the Host field. */
  const normalizeHostField = (): void => {
    if (!host.trim()) { return; }
    setHost(parsed.host);
    if (parsed.port !== undefined && !port.trim()) {
      setPort(String(parsed.port));
    }
  };

  const handleSubmit = (): void => {
    if (!isValid) { return; }
    onSubmit({
      id: initial?.id ?? crypto.randomUUID(),
      name: name.trim(),
      host: parsed.host,
      port: portNumber,
      auth: username.trim() ? { username: username.trim(), password } : undefined,
    });
  };

  const submitOnEnter = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter') { handleSubmit(); }
    if (e.key === 'Escape') { onCancel(); }
  };

  return (
    <div style={styles.form}>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={submitOnEnter}
        placeholder="Name (e.g. Corporate proxy)"
        style={styles.input}
        autoFocus
      />
      <div style={styles.row}>
        <input
          type="text"
          value={host}
          onChange={(e) => setHost(e.target.value)}
          onKeyDown={submitOnEnter}
          onBlur={normalizeHostField}
          placeholder="Host (proxy.example.com)"
          style={{
            ...styles.input,
            flex: 3,
            ...(hostError ? styles.inputError : {}),
          }}
        />
        <input
          type="number"
          value={port}
          onChange={(e) => setPort(e.target.value)}
          onKeyDown={submitOnEnter}
          placeholder="Port"
          style={{ ...styles.input, flex: 1, minWidth: 0 }}
        />
      </div>
      {hostError && <p style={styles.error}>{hostError}</p>}
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        onKeyDown={submitOnEnter}
        placeholder="Username (optional)"
        style={{ ...styles.input, ...(authError ? styles.inputError : {}) }}
      />
      <SecretInput
        value={password}
        onChange={setPassword}
        onKeyDown={submitOnEnter}
        placeholder="Password (optional)"
        inputStyle={styles.input}
        label="proxy password"
      />
      {authError && <p style={styles.error}>{authError}</p>}
      <div style={styles.actions}>
        <button onClick={handleSubmit} disabled={!isValid} style={{
          ...styles.saveBtn,
          ...(isValid ? {} : styles.disabledBtn),
        }}>
          {initial ? 'Save' : 'Add proxy'}
        </button>
        <button onClick={onCancel} style={styles.cancelBtn}>Cancel</button>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  form: {
    padding: '6px 8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    borderBottom: '1px solid var(--vscode-panel-border)',
  },
  row: {
    display: 'flex',
    gap: '4px',
  },
  input: {
    padding: '3px 6px',
    fontSize: '11px',
    background: 'var(--vscode-input-background)',
    color: 'var(--vscode-input-foreground)',
    border: '1px solid var(--vscode-input-border)',
    borderRadius: '2px',
    boxSizing: 'border-box',
  },
  inputError: {
    borderColor: 'var(--vscode-inputValidation-errorBorder, #be1100)',
  },
  error: {
    fontSize: '10px',
    lineHeight: 1.4,
    margin: 0,
    color: 'var(--vscode-inputValidation-errorForeground, #f48771)',
  },
  actions: {
    display: 'flex',
    gap: '4px',
    marginTop: '2px',
  },
  saveBtn: {
    flex: 1,
    padding: '3px 8px',
    fontSize: '11px',
    background: 'var(--vscode-button-background)',
    color: 'var(--vscode-button-foreground)',
    border: 'none',
    borderRadius: '2px',
    cursor: 'pointer',
  },
  disabledBtn: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  cancelBtn: {
    padding: '3px 8px',
    fontSize: '11px',
    background: 'var(--vscode-button-secondaryBackground)',
    color: 'var(--vscode-button-secondaryForeground)',
    border: 'none',
    borderRadius: '2px',
    cursor: 'pointer',
  },
};

import React from 'react';
import type { IHttpSettings } from '../types';

interface SettingsEditorProps {
  settings: IHttpSettings;
  onChange: (settings: IHttpSettings) => void;
}

/** Workspace defaults, mirrored from package.json's `joltapi.*` configuration. */
const DEFAULTS: IHttpSettings = {
  timeout: 30000,
  sslVerify: true,
  followRedirects: true,
  maxRedirects: 5,
};

/**
 * Per-request execution settings. These were modeled and honored by the extension host
 * from day one but had no UI — a request could only ever run with the defaults baked in
 * by `createDefaultRequest()`.
 */
export const SettingsEditor: React.FC<SettingsEditorProps> = ({ settings, onChange }) => {
  const set = <K extends keyof IHttpSettings>(key: K, value: IHttpSettings[K]): void =>
    onChange({ ...settings, [key]: value });

  const timeoutSeconds = settings.timeout / 1000;
  const isDefault =
    settings.timeout === DEFAULTS.timeout &&
    settings.sslVerify === DEFAULTS.sslVerify &&
    settings.followRedirects === DEFAULTS.followRedirects &&
    settings.maxRedirects === DEFAULTS.maxRedirects;

  return (
    <div style={styles.container}>
      <div style={styles.field}>
        <label style={styles.label}>Timeout (seconds)</label>
        <input
          type="number"
          min={1}
          value={Number.isFinite(timeoutSeconds) ? timeoutSeconds : ''}
          onChange={(e) => {
            const seconds = Number(e.target.value);
            set('timeout', seconds > 0 ? Math.round(seconds * 1000) : 0);
          }}
          style={styles.input}
        />
        <p style={styles.help}>
          How long to wait before aborting. Applied per request — the workspace default is{' '}
          {DEFAULTS.timeout / 1000}s (<code>joltapi.timeout</code>).
        </p>
      </div>

      <label style={styles.toggleRow}>
        <input
          type="checkbox"
          checked={settings.sslVerify}
          onChange={(e) => set('sslVerify', e.target.checked)}
          style={styles.checkbox}
        />
        <span>Verify SSL certificates</span>
      </label>
      {!settings.sslVerify && (
        <p style={styles.warning}>
          Certificate verification is off for this request. Responses can be intercepted or
          forged — only use this against a server with a self-signed certificate you trust.
        </p>
      )}

      <label style={styles.toggleRow}>
        <input
          type="checkbox"
          checked={settings.followRedirects}
          onChange={(e) => set('followRedirects', e.target.checked)}
          style={styles.checkbox}
        />
        <span>Follow redirects</span>
      </label>

      {settings.followRedirects && (
        <div style={styles.field}>
          <label style={styles.label}>Max redirects</label>
          <input
            type="number"
            min={0}
            value={settings.maxRedirects}
            onChange={(e) => set('maxRedirects', Math.max(0, Number(e.target.value) || 0))}
            style={{ ...styles.input, maxWidth: '120px' }}
          />
        </div>
      )}

      {!isDefault && (
        <button onClick={() => onChange({ ...DEFAULTS })} style={styles.resetBtn}>
          Reset to defaults
        </button>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '12px 8px',
  },
  field: {
    marginBottom: '12px',
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
  help: {
    margin: '4px 0 0 0',
    fontSize: '11px',
    lineHeight: 1.4,
    color: 'var(--vscode-descriptionForeground)',
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
  warning: {
    fontSize: '11px',
    lineHeight: 1.4,
    color: 'var(--vscode-inputValidation-warningForeground, #cca700)',
    backgroundColor: 'var(--vscode-inputValidation-warningBackground, rgba(204, 167, 0, 0.1))',
    padding: '4px 8px',
    borderRadius: '2px',
    margin: '0 0 10px 0',
  },
  resetBtn: {
    padding: '4px 10px',
    fontSize: '11px',
    background: 'var(--vscode-button-secondaryBackground)',
    color: 'var(--vscode-button-secondaryForeground)',
    border: 'none',
    borderRadius: '2px',
    cursor: 'pointer',
  },
};

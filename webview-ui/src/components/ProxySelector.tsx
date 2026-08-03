import React from 'react';
import type { IProxyConfig, IProxyProfile } from '../types';

interface ProxySelectorProps {
  /** Currently selected profile id — empty/undefined means "send directly". */
  proxyId: string | undefined;
  /** Saved profiles, managed in the sidebar's Proxies tab. */
  profiles: IProxyProfile[];
  /** False while the host's `loadProxies` answer is still in flight — see `proxyStore`. */
  profilesLoaded: boolean;
  /** Inline proxy from requests saved before 0.5.0, shown read-only so it isn't invisible. */
  legacyProxy?: IProxyConfig;
  onChange: (proxyId: string | undefined) => void;
}

const NONE = '';
/** Sentinel for the legacy inline proxy, which has no profile id to select. */
const LEGACY = '__legacy__';

/**
 * Per-request proxy *selection*. Proxies themselves are defined once in the sidebar's
 * Proxies tab and shared across every request — this only records which one this request
 * goes through, so editing a proxy's host/port updates every request using it.
 */
export const ProxySelector: React.FC<ProxySelectorProps> = ({
  proxyId,
  profiles,
  profilesLoaded,
  legacyProxy,
  onChange,
}) => {
  const selected = profiles.find((p) => p.id === proxyId);
  // Only claim a proxy was deleted once the profile list has actually arrived.
  const isMissing = !!proxyId && !selected && profilesLoaded;
  const isPending = !!proxyId && !selected && !profilesLoaded;
  const showLegacy = !proxyId && !!legacyProxy?.enabled;

  const handleChange = (value: string): void => {
    // The legacy option is informational — it can't be re-selected, only replaced.
    if (value === LEGACY) {return;}
    onChange(value === NONE ? undefined : value);
  };

  return (
    <div style={styles.container}>
      <div style={styles.field}>
        <label style={styles.label}>Proxy</label>
        <select
          value={showLegacy ? LEGACY : (proxyId ?? NONE)}
          onChange={(e) => handleChange(e.target.value)}
          style={styles.select}
        >
          <option value={NONE}>No proxy — send directly</option>
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.host}:{p.port})
            </option>
          ))}
          {showLegacy && (
            <option value={LEGACY}>
              Legacy inline proxy ({legacyProxy!.host}:{legacyProxy!.port})
            </option>
          )}
          {isPending && <option value={proxyId}>Loading saved proxies…</option>}
          {isMissing && <option value={proxyId}>⚠ Missing proxy — deleted</option>}
        </select>
      </div>

      {isMissing && (
        <p style={styles.error}>
          This request points at a proxy that no longer exists. Sending it will fail until you
          pick another one — re-create it in the sidebar’s Proxies tab to keep the same setup.
        </p>
      )}

      {isPending && (
        <p style={styles.hint}>Loading this request’s proxy…</p>
      )}

      {selected && (
        <div style={styles.summary}>
          <div style={styles.summaryRow}>
            <span style={styles.summaryKey}>Address</span>
            <span style={styles.summaryValue}>{selected.host}:{selected.port}</span>
          </div>
          <div style={styles.summaryRow}>
            <span style={styles.summaryKey}>Auth</span>
            <span style={styles.summaryValue}>
              {selected.auth?.username ? `${selected.auth.username} / ••••••` : 'None'}
            </span>
          </div>
        </div>
      )}

      {showLegacy && (
        <div style={styles.summary}>
          <div style={styles.summaryRow}>
            <span style={styles.summaryKey}>Legacy inline proxy</span>
            <span style={styles.summaryValue}>{legacyProxy!.host}:{legacyProxy!.port}</span>
          </div>
          <p style={styles.hint}>
            This request was saved with an older JoltAPI that stored the proxy inline. It still
            works — pick a saved proxy above to migrate it.
          </p>
        </div>
      )}

      {!selected && !isMissing && !isPending && !showLegacy && (
        profiles.length === 0 ? (
          <p style={styles.hint}>
            No proxies saved yet. Open the JoltAPI sidebar, switch to the{' '}
            <strong>Proxies</strong> tab, and add one — it will show up here for every request.
          </p>
        ) : (
          <p style={styles.hint}>
            This request is sent directly. Proxies are defined once in the sidebar’s{' '}
            <strong>Proxies</strong> tab, then picked here — the same proxy can be reused by any
            number of requests.
          </p>
        )
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '12px 8px',
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
  select: {
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
  summary: {
    border: '1px solid var(--vscode-panel-border)',
    borderRadius: '2px',
    padding: '8px',
    marginBottom: '8px',
  },
  summaryRow: {
    display: 'flex',
    gap: '8px',
    fontSize: '11px',
    marginBottom: '4px',
  },
  summaryKey: {
    color: 'var(--vscode-descriptionForeground)',
    minWidth: '120px',
  },
  summaryValue: {
    color: 'var(--vscode-foreground)',
    wordBreak: 'break-all',
  },
  hint: {
    color: 'var(--vscode-descriptionForeground)',
    fontSize: '12px',
    fontStyle: 'italic',
    lineHeight: 1.5,
  },
  error: {
    fontSize: '11px',
    color: 'var(--vscode-inputValidation-errorForeground, #f48771)',
    backgroundColor: 'var(--vscode-inputValidation-errorBackground, rgba(244, 135, 113, 0.1))',
    padding: '6px 8px',
    borderRadius: '2px',
    marginBottom: '8px',
    lineHeight: 1.5,
  },
};

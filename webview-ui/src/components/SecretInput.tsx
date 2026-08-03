import React, { useState } from 'react';

interface SecretInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Merged over the default input styling — callers own their own sizing/theming. */
  inputStyle?: React.CSSProperties;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  autoFocus?: boolean;
  /** Accessible name for the toggle, e.g. "bearer token". */
  label?: string;
}

/**
 * Masked text input with a show/hide toggle.
 *
 * Sensitive values (tokens, passwords, API keys) stay `type="password"` by default — the
 * eye button reveals them only while the user asks for it, so a shoulder-surfable value is
 * never the default state. Use this instead of a bare `type="password"` input anywhere the
 * user has to check what they typed.
 */
export const SecretInput: React.FC<SecretInputProps> = ({
  value,
  onChange,
  placeholder,
  inputStyle,
  onKeyDown,
  autoFocus,
  label = 'value',
}) => {
  const [revealed, setRevealed] = useState(false);

  return (
    <div style={styles.wrapper}>
      <input
        type={revealed ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        autoFocus={autoFocus}
        style={{ ...styles.input, ...inputStyle, paddingRight: '26px' }}
      />
      <button
        type="button"
        onClick={() => setRevealed((r) => !r)}
        style={styles.toggle}
        title={revealed ? `Hide ${label}` : `Show ${label}`}
        aria-label={revealed ? `Hide ${label}` : `Show ${label}`}
        aria-pressed={revealed}
      >
        {revealed ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  );
};

const EyeIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
    <path d="M8 3C4.5 3 1.7 5.4 1 8c.7 2.6 3.5 5 7 5s6.3-2.4 7-5c-.7-2.6-3.5-5-7-5zm0 8.5c-2.6 0-5-1.7-5.7-3.5C3 6.2 5.4 4.5 8 4.5s5 1.7 5.7 3.5c-.7 1.8-3.1 3.5-5.7 3.5zm0-6a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zm0 4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z" />
  </svg>
);

const EyeOffIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
    <path d="M2.7 1.6 1.6 2.7l2.1 2.1C2.4 5.7 1.4 6.8 1 8c.7 2.6 3.5 5 7 5 1.2 0 2.3-.3 3.3-.7l2 2 1.1-1.1L2.7 1.6zm5.3 9.9c-2.6 0-5-1.7-5.7-3.5.4-.9 1.2-1.8 2.2-2.4l1.6 1.6a2.5 2.5 0 0 0 3.3 3.3l1 1c-.7.2-1.5.3-2.4.3zM8 4.5c2.6 0 5 1.7 5.7 3.5-.3.8-1 1.6-1.8 2.2l1.1 1.1c1.1-.8 2-1.8 2.3-2.8-.7-2.6-3.5-5-7-5-.8 0-1.6.1-2.3.4l1.2 1.2c.3-.1.6-.1.8-.1z" />
  </svg>
);

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
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
  toggle: {
    position: 'absolute',
    right: '2px',
    display: 'flex',
    alignItems: 'center',
    padding: '2px 4px',
    background: 'none',
    border: 'none',
    color: 'var(--vscode-descriptionForeground)',
    cursor: 'pointer',
  },
};

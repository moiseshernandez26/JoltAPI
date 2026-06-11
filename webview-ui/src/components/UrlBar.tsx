import React, { useMemo } from 'react';

interface UrlBarProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  placeholder?: string;
}

const VARIABLE_COLOR = '#e0a030';

/**
 * URL input with variable {{name}} highlighting.
 * Uses a backdrop div with highlighted text behind a transparent input.
 */
export const UrlBar: React.FC<UrlBarProps> = ({
  value,
  onChange,
  onKeyDown,
  disabled,
  placeholder = 'https://api.example.com/v1/resource',
}) => {
  const highlightedHtml = useMemo(() => {
    if (!value) {return '';}
    return highlightVariables(value);
  }, [value]);
  const hasContent = value.length > 0;

  return (
    <div style={styles.wrapper}>
      {/* Backdrop with highlights */}
      <div style={styles.backdrop} aria-hidden="true">
        {hasContent && (
          <span dangerouslySetInnerHTML={{ __html: highlightedHtml }} />
        )}
      </div>
      {/* Transparent input on top */}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        disabled={disabled}
        placeholder={placeholder}
        spellCheck={false}
        style={{
          ...styles.input,
          color: hasContent ? 'transparent' : 'var(--vscode-input-foreground)',
        }}
      />
    </div>
  );
};

function highlightVariables(text: string): string {
  if (!text) {return '';}
  return escapeHtml(text).replace(
    /\{\{([a-zA-Z_][a-zA-Z0-9_-]*)\}\}/g,
    (_full, name) =>
      `<span style="color: ${VARIABLE_COLOR}; font-weight: bold">{{${name}}}</span>`,
  );
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const BASE_INPUT_STYLE: React.CSSProperties = {
  padding: '6px 10px',
  fontSize: '13px',
  fontFamily: 'var(--vscode-editor-font-family, monospace)',
  lineHeight: 'normal',
  border: '1px solid var(--vscode-input-border)',
  borderRadius: '2px',
};

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    position: 'relative',
    flex: 1,
    minWidth: 0,
    backgroundColor: 'var(--vscode-input-background)',
    borderRadius: '2px',
  },
  backdrop: {
    ...BASE_INPUT_STYLE,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    whiteSpace: 'pre',
    pointerEvents: 'none',
    zIndex: 0,
    color: 'var(--vscode-input-foreground)',
    border: '1px solid transparent',
  },
  input: {
    ...BASE_INPUT_STYLE,
    position: 'relative',
    zIndex: 1,
    width: '100%',
    caretColor: 'var(--vscode-input-foreground)',
    backgroundColor: 'transparent',
  },
};

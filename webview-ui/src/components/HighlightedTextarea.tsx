import React, { useMemo } from 'react';

interface HighlightedTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  language?: 'json' | 'xml' | 'html' | 'text';
  errorMessage?: string | null;
}

const VARIABLE_COLOR = '#e0a030';

/**
 * A textarea with syntax highlighting overlay.
 * When empty, uses the native textarea placeholder.
 * When filled, renders a backdrop div with highlighted code behind a transparent textarea.
 */
export const HighlightedTextarea: React.FC<HighlightedTextareaProps> = ({
  value,
  onChange,
  placeholder = '',
  rows = 12,
  language = 'text',
  errorMessage,
}) => {
  const highlightedHtml = useMemo(() => {
    return highlightText(value, language);
  }, [value, language]);

  const hasContent = value.length > 0;

  return (
    <div style={styles.wrapper}>
      {/* Backdrop — only visible when there's content */}
      {hasContent && (
        <pre style={styles.backdrop} aria-hidden="true">
          <code dangerouslySetInnerHTML={{ __html: highlightedHtml }} />
        </pre>
      )}
      {/* Textarea on top */}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        spellCheck={false}
        style={{
          ...styles.textarea,
          color: hasContent ? 'transparent' : 'var(--vscode-input-foreground)',
          caretColor: 'var(--vscode-input-foreground)',
          borderColor: errorMessage
            ? 'var(--vscode-inputValidation-errorBorder)'
            : 'var(--vscode-input-border)',
        }}
      />
      {errorMessage && <p style={styles.error}>{errorMessage}</p>}
    </div>
  );
};

function highlightText(text: string, language: string): string {
  if (!text) {return '';}
  let html = highlightVariables(text);
  if (language === 'json') {
    html = highlightJsonSyntax(html);
  }
  return html;
}

function highlightVariables(text: string): string {
  return escapeHtml(text).replace(
    /\{\{([a-zA-Z_][a-zA-Z0-9_-]*)\}\}/g,
    (_full, name) =>
      `<span style="color: ${VARIABLE_COLOR}; font-weight: bold">{{${name}}}</span>`,
  );
}

function highlightJsonSyntax(html: string): string {
  return html
    .replace(
      /("(?:[^"\\]|\\.)*")\s*:/g,
      `<span style="color:${C.key}">$1</span>:`,
    )
    .replace(
      /:\s*("(?:[^"\\]|\\.)*")/g,
      `: <span style="color:${C.string}">$1</span>`,
    )
    .replace(
      /:\s*(\b(?:true|false|null)\b)/g,
      `: <span style="color:${C.bool}">$1</span>`,
    )
    .replace(
      /:\s*(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g,
      `: <span style="color:${C.number}">$1</span>`,
    );
}

const C = {
  key: '#9cdcfe',
  string: '#ce9178',
  number: '#b5cea8',
  bool: '#569cd6',
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    position: 'relative',
    width: '100%',
    marginTop: '4px',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    margin: 0,
    padding: '8px',
    fontSize: '12px',
    fontFamily: 'var(--vscode-editor-font-family, monospace)',
    lineHeight: '1.5',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
    overflow: 'hidden',
    pointerEvents: 'none',
    zIndex: 0,
    backgroundColor: 'var(--vscode-input-background)',
    border: '1px solid transparent',
    borderRadius: '2px',
  },
  textarea: {
    position: 'relative',
    zIndex: 1,
    width: '100%',
    padding: '8px',
    backgroundColor: 'transparent',
    border: '1px solid var(--vscode-input-border)',
    borderRadius: '2px',
    fontSize: '12px',
    fontFamily: 'var(--vscode-editor-font-family, monospace)',
    lineHeight: '1.5',
    resize: 'vertical',
    outline: 'none',
    boxSizing: 'border-box',
  },
  error: {
    color: 'var(--vscode-inputValidation-errorForeground)',
    backgroundColor: 'var(--vscode-inputValidation-errorBackground)',
    padding: '4px 8px',
    fontSize: '11px',
    marginTop: '4px',
    borderRadius: '2px',
  },
};

import React, { useMemo } from 'react';

interface ResponseBodyProps {
  body: string;
  contentType: string;
}

const MAX_BODY = 500_000;

/**
 * Response body viewer with JSON syntax highlighting.
 * Uses inline styles for reliable coloring across VS Code themes.
 */
export const ResponseBody: React.FC<ResponseBodyProps> = ({ body, contentType }) => {
  const { html, isJson } = useMemo(() => {
    if (!body) {return { html: '', isJson: false };}

    const trimmed = body.substring(0, MAX_BODY);
    const truncated = body.length > MAX_BODY;

    if (contentType.includes('json') || looksLikeJson(trimmed)) {
      return {
        html: highlightJson(trimmed) + (truncated ? '\n\n// ... truncated ...' : ''),
        isJson: true,
      };
    }

    return {
      html: escapeHtml(trimmed) + (truncated ? '\n\n// ... truncated ...' : ''),
      isJson: false,
    };
  }, [body, contentType]);

  if (!body) {return null;}

  return (
    <div style={styles.container}>
      <pre style={styles.pre}>
        <code
          style={styles.code}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </pre>
      {isJson && (
        <p style={styles.badge}>JSON</p>
      )}
    </div>
  );
};

function looksLikeJson(text: string): boolean {
  const trimmed = text.trim();
  return (trimmed.startsWith('{') || trimmed.startsWith('[')) && trimmed.length > 2;
}

function highlightJson(raw: string): string {
  try {
    const parsed = JSON.parse(raw);
    const formatted = JSON.stringify(parsed, null, 2);

    // Escape, then apply syntax coloring inline
    let html = escapeHtml(formatted);

    // Keys — quoted strings immediately before colon
    html = html.replace(
      /("(?:[^"\\]|\\.)*")\s*:/g,
      `<span style="color:${C.key}">$1</span>:`,
    );

    // String values — quoted strings after colon+space
    html = html.replace(
      /(:\s*)("(?:[^"\\]|\\.)*")/g,
      `$1<span style="color:${C.string}">$2</span>`,
    );

    // Numbers
    html = html.replace(
      /(:\s*)(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g,
      `$1<span style="color:${C.number}">$2</span>`,
    );

    // Booleans and null
    html = html.replace(
      /(:\s*)\b(true|false|null)\b/g,
      `$1<span style="color:${C.bool}">$2</span>`,
    );

    return html;
  } catch {
    return escapeHtml(raw);
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

const C = {
  key: '#9cdcfe',
  string: '#ce9178',
  number: '#b5cea8',
  bool: '#569cd6',
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'relative',
    flex: 1,
    overflow: 'auto',
  },
  pre: {
    margin: 0,
    padding: '12px',
    fontSize: '12px',
    fontFamily: 'var(--vscode-editor-font-family, monospace)',
    lineHeight: '1.5',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
    borderRadius: '2px',
    minHeight: '100%',
  },
  code: {
    fontFamily: 'inherit',
    fontSize: 'inherit',
  },
  badge: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    padding: '1px 6px',
    fontSize: '10px',
    backgroundColor: 'var(--vscode-badge-background)',
    color: 'var(--vscode-badge-foreground)',
    borderRadius: '3px',
  },
};

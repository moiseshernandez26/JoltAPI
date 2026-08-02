import React, { useLayoutEffect, useMemo, useRef } from 'react';

interface HighlightedTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  language?: 'json' | 'xml' | 'html' | 'text';
  errorMessage?: string | null;
}

const VARIABLE_COLOR = '#e0a030';
const INDENT = '    ';
/** Unambiguous open→close brackets, used for the Enter-key indent/split heuristics below. */
const BRACKET_PAIRS: Record<string, string> = { '(': ')', '[': ']', '{': '}' };
/** Brackets plus self-pairing quotes, used for auto-close-on-type and backspace-removes-pair. */
const AUTO_CLOSE_PAIRS: Record<string, string> = { ...BRACKET_PAIRS, '"': '"', "'": "'" };
const CLOSE_CHARS = new Set(Object.values(AUTO_CLOSE_PAIRS));

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

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pendingSelectionRef = useRef<{ start: number; end: number } | null>(null);

  // Controlled <textarea> resets selection on every value update from React; restore the
  // caret/selection we computed in handleKeyDown once the new value has actually rendered.
  useLayoutEffect(() => {
    const pending = pendingSelectionRef.current;
    if (pending && textareaRef.current) {
      textareaRef.current.selectionStart = pending.start;
      textareaRef.current.selectionEnd = pending.end;
      pendingSelectionRef.current = null;
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.ctrlKey || e.metaKey || e.altKey) {return;}

    const target = e.currentTarget;
    const { selectionStart, selectionEnd } = target;
    const hasSelection = selectionStart !== selectionEnd;

    if (e.key === 'Tab') {
      e.preventDefault();

      if (!e.shiftKey && !hasSelection) {
        // Plain Tab with just a caret: insert 4 spaces at the cursor.
        const newValue = value.slice(0, selectionStart) + INDENT + value.slice(selectionEnd);
        const caret = selectionStart + INDENT.length;
        pendingSelectionRef.current = { start: caret, end: caret };
        onChange(newValue);
        return;
      }

      const result = e.shiftKey
        ? outdentLines(value, selectionStart, selectionEnd)
        : indentLines(value, selectionStart, selectionEnd);
      pendingSelectionRef.current = { start: result.start, end: result.end };
      onChange(result.text);
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      const result = computeEnterInsertion(value, selectionStart, selectionEnd);
      pendingSelectionRef.current = { start: result.start, end: result.end };
      onChange(result.text);
      return;
    }

    if (e.key === 'Backspace') {
      const result = computeBackspaceDeletion(value, selectionStart, selectionEnd);
      if (result) {
        e.preventDefault();
        pendingSelectionRef.current = { start: result.start, end: result.end };
        onChange(result.text);
      }
      return;
    }

    // Type-over: typing a closing char right before an identical one just moves past it,
    // instead of inserting a duplicate. Checked before auto-close since quotes are their
    // own closing character.
    if (CLOSE_CHARS.has(e.key) && !hasSelection && value[selectionStart] === e.key) {
      e.preventDefault();
      const caret = selectionStart + 1;
      target.selectionStart = caret;
      target.selectionEnd = caret;
      return;
    }

    // Auto-close: typing an opening bracket/quote inserts its pair with the cursor between
    // them, or wraps the current selection with the pair (auto-surround).
    if (Object.prototype.hasOwnProperty.call(AUTO_CLOSE_PAIRS, e.key)) {
      const result = computeAutoCloseInsertion(e.key, value, selectionStart, selectionEnd);
      if (result) {
        e.preventDefault();
        pendingSelectionRef.current = { start: result.start, end: result.end };
        onChange(result.text);
      }
    }
  };

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
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
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

/** The start/end offsets of the line(s) touched by a [start, end) selection. */
function getLineBounds(text: string, start: number, end: number): { lineStart: number; lineEnd: number } {
  const lineStart = text.lastIndexOf('\n', start - 1) + 1;
  const nextBreak = text.indexOf('\n', end);
  const lineEnd = nextBreak === -1 ? text.length : nextBreak;
  return { lineStart, lineEnd };
}

/** Indents every line touched by the selection by one INDENT, VS Code block-indent style. */
export function indentLines(text: string, start: number, end: number): { text: string; start: number; end: number } {
  const { lineStart, lineEnd } = getLineBounds(text, start, end);
  const block = text.slice(lineStart, lineEnd);
  const lines = block.split('\n');
  const indented = lines.map((line) => INDENT + line).join('\n');
  const newText = text.slice(0, lineStart) + indented + text.slice(lineEnd);
  return {
    text: newText,
    start: start + INDENT.length,
    end: end + INDENT.length * lines.length,
  };
}

/** Removes up to one INDENT (or a leading tab) from the start of every line touched by the selection. */
export function outdentLines(text: string, start: number, end: number): { text: string; start: number; end: number } {
  const { lineStart, lineEnd } = getLineBounds(text, start, end);
  const block = text.slice(lineStart, lineEnd);
  const lines = block.split('\n');

  let firstLineRemoved = 0;
  let totalRemoved = 0;
  const outdented = lines.map((line, i) => {
    let removed = 0;
    if (line.startsWith(INDENT)) {
      removed = INDENT.length;
    } else if (line.startsWith('\t')) {
      removed = 1;
    } else {
      const leadingSpaces = /^ */.exec(line)?.[0].length ?? 0;
      removed = Math.min(leadingSpaces, INDENT.length);
    }
    if (i === 0) {firstLineRemoved = removed;}
    totalRemoved += removed;
    return line.slice(removed);
  });

  const newText = text.slice(0, lineStart) + outdented.join('\n') + text.slice(lineEnd);
  const newStart = Math.max(lineStart, start - firstLineRemoved);
  const newEnd = Math.max(newStart, end - totalRemoved);
  return { text: newText, start: newStart, end: newEnd };
}

/**
 * What happens when Enter is pressed: copies the current line's leading whitespace onto the
 * new line, adds one more INDENT if the char right before the caret opens a bracket, and —
 * VS Code's "split the pair" behavior — if the caret sits directly between a fresh
 * open/close pair (e.g. `{|}`), inserts two lines so the caret lands indented in between.
 */
export function computeEnterInsertion(text: string, start: number, end: number): { text: string; start: number; end: number } {
  const lineStart = text.lastIndexOf('\n', start - 1) + 1;
  const currentIndent = /^[ \t]*/.exec(text.slice(lineStart, start))?.[0] ?? '';
  const charBefore = text[start - 1];
  const charAfter = text[end];
  // Only real brackets trigger indent/split — NOT quotes: quotes are self-pairing, so seeing
  // `"` right before the caret could mean either "opening a string" or "closing one", and a
  // JSON string can't legally contain a raw newline either way.
  const opensPair = charBefore !== undefined && BRACKET_PAIRS[charBefore] !== undefined;

  if (opensPair && charAfter === BRACKET_PAIRS[charBefore]) {
    const inner = `\n${currentIndent}${INDENT}`;
    const outer = `\n${currentIndent}`;
    const newText = text.slice(0, start) + inner + outer + text.slice(end);
    const caret = start + inner.length;
    return { text: newText, start: caret, end: caret };
  }

  const nextIndent = opensPair ? currentIndent + INDENT : currentIndent;
  const insertion = `\n${nextIndent}`;
  const newText = text.slice(0, start) + insertion + text.slice(end);
  const caret = start + insertion.length;
  return { text: newText, start: caret, end: caret };
}

/**
 * Backspace right in the middle of an empty auto-closed pair (e.g. `(|)`) removes both
 * characters instead of leaving a dangling closer behind. Returns `null` for every other
 * case so the caller falls back to letting the browser's default Backspace happen.
 */
export function computeBackspaceDeletion(text: string, start: number, end: number): { text: string; start: number; end: number } | null {
  if (start !== end || start === 0) {return null;}
  const before = text[start - 1];
  const after = text[start];
  if (AUTO_CLOSE_PAIRS[before] !== after) {return null;}
  const newText = text.slice(0, start - 1) + text.slice(start + 1);
  const caret = start - 1;
  return { text: newText, start: caret, end: caret };
}

/**
 * Typing an opening bracket/quote: with a selection active, wraps the selection in the pair
 * (auto-surround); with just a caret, inserts the pair and places the caret between them.
 * Quotes skip auto-closing when adjacent to a word character, so editing inside an existing
 * word (e.g. a contraction in a raw-text body) doesn't get an unwanted stray quote.
 */
export function computeAutoCloseInsertion(char: string, text: string, start: number, end: number): { text: string; start: number; end: number } | null {
  const close = AUTO_CLOSE_PAIRS[char];
  if (start !== end) {
    const selected = text.slice(start, end);
    const newText = text.slice(0, start) + char + selected + close + text.slice(end);
    return { text: newText, start: start + 1, end: end + 1 };
  }

  if (char === '"' || char === "'") {
    const before = text[start - 1];
    const after = text[start];
    if ((before && /\w/.test(before)) || (after && /\w/.test(after))) {
      return null;
    }
  }

  const newText = text.slice(0, start) + char + close + text.slice(start);
  const caret = start + 1;
  return { text: newText, start: caret, end: caret };
}

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

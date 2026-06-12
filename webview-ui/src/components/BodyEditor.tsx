import React from 'react';
import type { IRequestBody, BodyType, RawContentType } from '../types';
import { KeyValueEditor } from './KeyValueEditor';
import { HighlightedTextarea } from './HighlightedTextarea';

interface BodyEditorProps {
  body: IRequestBody;
  onChange: (body: IRequestBody) => void;
}

const BODY_TYPES: { value: BodyType; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'json', label: 'JSON' },
  { value: 'form-data', label: 'Form Data' },
  { value: 'raw', label: 'Raw' },
];

const RAW_TYPES: { value: RawContentType; label: string }[] = [
  { value: 'text/plain', label: 'Text' },
  { value: 'application/json', label: 'JSON' },
  { value: 'application/xml', label: 'XML' },
  { value: 'text/html', label: 'HTML' },
  { value: 'application/javascript', label: 'JavaScript' },
];

/**
 * Body editor with type selector (none, JSON, form-data, raw).
 * Includes JSON validation for the JSON body type.
 */
export const BodyEditor: React.FC<BodyEditorProps> = ({ body, onChange }) => {
  const handleTypeChange = (type: BodyType): void => {
    const updated: IRequestBody = { type };
    if (type === 'json') {
      updated.jsonBody = body.jsonBody ?? '';
    }
    if (type === 'form-data') {
      updated.formData = body.formData ?? [];
      updated.formEncoding = body.formEncoding ?? 'urlencoded';
    }
    if (type === 'raw') {
      updated.rawBody = body.rawBody ?? '';
      updated.rawContentType = body.rawContentType ?? 'text/plain';
    }
    onChange(updated);
  };

  const jsonError = body.type === 'json' && body.jsonBody
    ? getJsonError(body.jsonBody)
    : null;

  return (
    <div style={styles.container}>
      <div style={styles.typeBar}>
        {BODY_TYPES.map((bt) => (
          <button
            key={bt.value}
            onClick={() => handleTypeChange(bt.value)}
            style={{
              ...styles.typeBtn,
              ...(body.type === bt.value ? styles.activeTypeBtn : {}),
            }}
          >
            {bt.label}
          </button>
        ))}
      </div>

      <div style={styles.content}>
        {body.type === 'none' && (
          <p style={styles.hint}>No request body will be sent.</p>
        )}

        {body.type === 'json' && (
          <div>
            <HighlightedTextarea
              value={body.jsonBody ?? ''}
              onChange={(value) => onChange({ ...body, jsonBody: value })}
              placeholder='{"key": "value"}'
              rows={12}
              language="json"
              errorMessage={jsonError}
            />
          </div>
        )}

        {body.type === 'form-data' && (
          <div>
            <div style={styles.encodingRow}>
              <label style={styles.encodingLabel}>Encoding</label>
              <select
                value={body.formEncoding ?? 'urlencoded'}
                onChange={(e) =>
                  onChange({ ...body, formEncoding: e.target.value as 'urlencoded' | 'multipart' })
                }
                style={styles.select}
              >
                <option value="urlencoded">application/x-www-form-urlencoded</option>
                <option value="multipart">multipart/form-data</option>
              </select>
            </div>
            <KeyValueEditor
              pairs={body.formData ?? []}
              onChange={(formData) => onChange({ ...body, formData })}
              keyPlaceholder="Field name"
              valuePlaceholder="Field value"
            />
          </div>
        )}

        {body.type === 'raw' && (
          <div>
            <select
              value={body.rawContentType ?? 'text/plain'}
              onChange={(e) =>
                onChange({ ...body, rawContentType: e.target.value as RawContentType })
              }
              style={styles.select}
            >
              {RAW_TYPES.map((rt) => (
                <option key={rt.value} value={rt.value}>
                  {rt.label}
                </option>
              ))}
            </select>
            <HighlightedTextarea
              value={body.rawBody ?? ''}
              onChange={(value) => onChange({ ...body, rawBody: value })}
              placeholder="Raw request body..."
              rows={12}
              language={getLanguage((body.rawContentType ?? 'text/plain') as RawContentType)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

function getJsonError(text: string): string | null {
  if (text.trim() === '') {
    return null;
  }
  try {
    JSON.parse(text);
    return null;
  } catch (err: unknown) {
    return err instanceof Error ? err.message : 'Invalid JSON';
  }
}

function getLanguage(contentType: RawContentType): 'json' | 'xml' | 'html' | 'text' {
  if (contentType.includes('json')) {return 'json';}
  if (contentType.includes('xml')) {return 'xml';}
  if (contentType.includes('html')) {return 'html';}
  return 'text';
}

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
    padding: '8px',
  },
  hint: {
    color: 'var(--vscode-descriptionForeground)',
    fontSize: '12px',
    fontStyle: 'italic',
  },
  select: {
    padding: '4px 8px',
    backgroundColor: 'var(--vscode-input-background)',
    color: 'var(--vscode-input-foreground)',
    border: '1px solid var(--vscode-input-border)',
    borderRadius: '2px',
    fontSize: '12px',
    marginBottom: '8px',
  },
  encodingRow: {
    display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px',
  },
  encodingLabel: {
    fontSize: '11px', color: 'var(--vscode-descriptionForeground)',
  },
};

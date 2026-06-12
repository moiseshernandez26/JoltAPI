import React from 'react';
import type { IKeyValuePair } from '../types';
import { AutocompleteInput } from './AutocompleteInput';

interface Suggestion {
  label: string;
  value?: string;
}

interface KeyValueEditorProps {
  pairs: IKeyValuePair[];
  onChange: (pairs: IKeyValuePair[]) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
  suggestions?: Suggestion[];
  valueSuggestions?: Record<string, Suggestion[]>;
}

export const KeyValueEditor: React.FC<KeyValueEditorProps> = ({
  pairs,
  onChange,
  keyPlaceholder = 'Key',
  valuePlaceholder = 'Value',
  suggestions,
  valueSuggestions,
}) => {
  const addRow = (): void => {
    const newPair: IKeyValuePair = {
      id: crypto.randomUUID(),
      key: '',
      value: '',
      enabled: true,
    };
    onChange([...pairs, newPair]);
  };

  const removeRow = (id: string): void => {
    onChange(pairs.filter((pair) => pair.id !== id));
  };

  const toggleRow = (id: string): void => {
    const updated = pairs.map((pair) =>
      pair.id === id ? { ...pair, enabled: !pair.enabled } : pair,
    );
    onChange(updated);
  };

  const getValueTips = (pair: IKeyValuePair): Suggestion[] | undefined => {
    if (!valueSuggestions) {return undefined;}
    const key = pair.key.toLowerCase();
    return valueSuggestions[key];
  };

  return (
    <div style={styles.container}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}></th>
            <th style={styles.th}>{keyPlaceholder}</th>
            <th style={styles.th}>{valuePlaceholder}</th>
            <th style={styles.th}></th>
          </tr>
        </thead>
        <tbody>
          {pairs.map((pair, index) => (
            <tr key={pair.id}>
              <td style={styles.td}>
                <input
                  type="checkbox"
                  checked={pair.enabled}
                  onChange={() => toggleRow(pair.id)}
                  title="Enable / disable"
                  style={styles.checkbox}
                />
              </td>
              <td style={styles.td}>
                <AutocompleteInput
                  value={pair.key}
                  onChange={(key) => {
                    const updated = pairs.map((p) =>
                      p.id === pair.id ? { ...p, key } : p,
                    );
                    onChange(updated);
                  }}
                  onClear={() => {
                    const updated = pairs.map((p) =>
                      p.id === pair.id ? { ...p, key: '' } : p,
                    );
                    onChange(updated);
                    if (document.activeElement instanceof HTMLElement) {
                      document.activeElement.blur();
                    }
                  }}
                  placeholder={keyPlaceholder}
                  suggestions={suggestions}
                  disabled={!pair.enabled}
                />
              </td>
              <td style={styles.td}>
                <AutocompleteInput
                  value={pair.value}
                  onChange={(value) => {
                    const updated = pairs.map((p) =>
                      p.id === pair.id ? { ...p, value } : p,
                    );
                    onChange(updated);
                  }}
                  onClear={() => {
                    const updated = pairs.map((p) =>
                      p.id === pair.id ? { ...p, value: '' } : p,
                    );
                    onChange(updated);
                    if (document.activeElement instanceof HTMLElement) {
                      document.activeElement.blur();
                    }
                  }}
                  placeholder={valuePlaceholder}
                  suggestions={getValueTips(pair)}
                  disabled={!pair.enabled}
                />
              </td>
              <td style={styles.td}>
                <button
                  onClick={() => removeRow(pair.id)}
                  title="Remove row"
                  style={styles.removeBtn}
                >
                  x
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={addRow} style={styles.addBtn}>
        + Add Row
      </button>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { padding: '8px' },
  table: { width: '100%', borderCollapse: 'collapse' as const },
  th: {
    textAlign: 'left', fontSize: '11px', fontWeight: 'normal',
    color: 'var(--vscode-descriptionForeground)', padding: '2px 4px', width: '5%',
  },
  td: { padding: '2px 4px', verticalAlign: 'middle' },
  checkbox: { margin: 0, cursor: 'pointer' },
  removeBtn: {
    padding: '1px 6px', backgroundColor: 'transparent',
    color: 'var(--vscode-descriptionForeground)',
    border: 'none', cursor: 'pointer', fontSize: '14px',
  },
  addBtn: {
    marginTop: '4px', padding: '4px 12px', backgroundColor: 'transparent',
    color: 'var(--vscode-textLink-foreground)',
    border: 'none', cursor: 'pointer', fontSize: '12px',
  },
};
import React, { useState, useRef, useEffect } from 'react';

interface Suggestion {
  label: string;
  value?: string;
}

interface AutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  placeholder?: string;
  suggestions?: Suggestion[];
  disabled?: boolean;
}

export const AutocompleteInput: React.FC<AutocompleteInputProps> = ({
  value,
  onChange,
  onClear,
  placeholder = '',
  suggestions,
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent): void => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = getFilteredSuggestions(value, suggestions);

  const handleFocus = (): void => {
    if (suggestions && suggestions.length > 0) {setOpen(true);}
  };

  const handleSelect = (label: string): void => {
    onChange(label);
    setOpen(false);
  };

  return (
    <div style={styles.wrapper} ref={wrapperRef}>
      <div style={styles.inputRow}>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={handleFocus}
          placeholder={placeholder}
          autoComplete="off"
          disabled={disabled}
          style={{
            ...styles.input,
            opacity: disabled ? 0.5 : 1,
            paddingRight: value ? '22px' : '6px',
          }}
        />
        {value && !disabled && (
          <span
            style={styles.clearBtn}
            onMouseDown={(e) => {
              e.preventDefault();
              onClear();
            }}
            title="Clear"
          >
            x
          </span>
        )}
      </div>
      {open && filtered.length > 0 && (
        <div style={styles.dropdown}>
          {filtered.map((s) => (
            <div
              key={s.label}
              style={{
                ...styles.dropdownItem,
                ...(hovered === s.label ? styles.dropdownItemHover : {}),
              }}
              onMouseEnter={() => setHovered(s.label)}
              onMouseLeave={() => setHovered(null)}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(s.label);
              }}
            >
              <span style={styles.dropdownLabel}>{s.label}</span>
              {s.value && <span style={styles.dropdownHint}>{s.value}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

function getFilteredSuggestions(input: string, list?: Suggestion[]): Suggestion[] {
  if (!list) {return [];}
  if (!input) {return list;}
  const lower = input.toLowerCase();
  return list.filter((s) => s.label.toLowerCase().includes(lower));
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: { position: 'relative', display: 'flex', alignItems: 'center' },
  inputRow: { position: 'relative', display: 'flex', alignItems: 'center', width: '100%' },
  input: {
    width: '100%', padding: '4px 6px',
    backgroundColor: 'var(--vscode-input-background)',
    color: 'var(--vscode-input-foreground)',
    border: '1px solid var(--vscode-input-border)',
    borderRadius: '2px', fontSize: '12px', outline: 'none',
  },
  clearBtn: {
    position: 'absolute', right: '4px', top: '50%',
    transform: 'translateY(-50%)',
    width: '16px', height: '16px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '12px', fontWeight: 'bold',
    color: 'var(--vscode-descriptionForeground)',
    cursor: 'pointer', borderRadius: '50%',
    lineHeight: 1, userSelect: 'none',
  },
  dropdown: {
    position: 'absolute', top: '100%', left: 0, right: 0,
    zIndex: 10, maxHeight: '180px', overflowY: 'auto',
    backgroundColor: 'var(--vscode-dropdown-background)',
    border: '1px solid var(--vscode-dropdown-border)',
    borderRadius: '4px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    marginTop: '4px',
  },
  dropdownItem: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '6px 10px', cursor: 'pointer', fontSize: '12px',
    color: 'var(--vscode-dropdown-foreground)',
  },
  dropdownItemHover: {
    backgroundColor: 'var(--vscode-dropdown-listHoverBackground)',
  },
  dropdownLabel: { fontWeight: 'bold' },
  dropdownHint: {
    fontSize: '11px', color: 'var(--vscode-descriptionForeground)',
    marginLeft: '12px', whiteSpace: 'nowrap',
  },
};
import React from 'react';

interface RequestTabsProps {
  activeTab: 'headers' | 'body' | 'params' | 'auth' | 'proxy' | 'settings';
  onTabChange: (tab: 'headers' | 'body' | 'params' | 'auth' | 'proxy' | 'settings') => void;
}

const TABS: { id: RequestTabsProps['activeTab']; label: string }[] = [
  { id: 'params', label: 'Params' },
  { id: 'headers', label: 'Headers' },
  { id: 'body', label: 'Body' },
  { id: 'auth', label: 'Auth' },
  { id: 'proxy', label: 'Proxy' },
  { id: 'settings', label: 'Settings' },
];

/**
 * Tab bar for switching between request configuration sections.
 */
export const RequestTabs: React.FC<RequestTabsProps> = ({ activeTab, onTabChange }) => {
  return (
    <div style={styles.tabBar}>
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          style={{
            ...styles.tab,
            ...(activeTab === tab.id ? styles.activeTab : {}),
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  tabBar: {
    display: 'flex',
    borderBottom: '1px solid var(--vscode-panel-border)',
    backgroundColor: 'var(--vscode-editor-background)',
  },
  tab: {
    padding: '6px 16px',
    backgroundColor: 'transparent',
    color: 'var(--vscode-descriptionForeground)',
    border: 'none',
    borderBottom: '2px solid transparent',
    cursor: 'pointer',
    fontSize: '12px',
  },
  activeTab: {
    color: 'var(--vscode-foreground)',
    borderBottomColor: 'var(--vscode-focusBorder)',
  },
};

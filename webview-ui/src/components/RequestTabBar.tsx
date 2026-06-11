import React, { useState, useEffect } from 'react';
import { useTabStore, useRequestStore } from '../store';

interface TabMenu {
  x: number;
  y: number;
  index: number;
}

export const RequestTabBar: React.FC = () => {
  const tabs = useTabStore((s) => s.tabs);
  const activeTabIndex = useTabStore((s) => s.activeTabIndex);
  const setActiveTab = useTabStore((s) => s.setActiveTab);
  const addTab = useTabStore((s) => s.addTab);
  const removeTab = useTabStore((s) => s.removeTab);
  const updateTab = useTabStore((s) => s.updateTab);
  const closeAllTabs = useTabStore((s) => s.closeAllTabs);
  const closeOtherTabs = useTabStore((s) => s.closeOtherTabs);
  const currentRequest = useRequestStore((s) => s.currentRequest);
  const isDirty = useRequestStore((s) => s.isDirty);
  const [tabMenu, setTabMenu] = useState<TabMenu | null>(null);

  useEffect(() => {
    const close = (): void => setTabMenu(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  const handleTabClick = (index: number): void => {
    if (index === activeTabIndex) {return;}
    if (isDirty) {
      const confirmed = confirm('You have unsaved changes. Discard them and switch tabs?');
      if (!confirmed) {return;}
    }
    setActiveTab(index);
    const tab = tabs[index];
    if (tab) {
      useRequestStore.getState().loadRequest({
        id: tab.id,
        name: tab.name,
        method: tab.method,
        url: tab.url,
        headers: [],
        queryParams: [],
        body: { type: 'none' },
        auth: { type: 'none' },
        proxy: { enabled: false, host: '', port: 0 },
        settings: { timeout: 30000, sslVerify: true, followRedirects: true, maxRedirects: 5 },
      });
    }
  };

  const handleClose = (e: React.MouseEvent, index: number): void => {
    e.stopPropagation();
    const tabStore = useTabStore.getState();
    const wasClosingActiveTab = index === tabStore.activeTabIndex;
    removeTab(index);
    if (wasClosingActiveTab) {
      const newState = useTabStore.getState();
      const tab = newState.tabs[newState.activeTabIndex];
      if (tab) {
        useRequestStore.getState().loadRequest({
          id: tab.id,
          name: tab.name,
          method: tab.method,
          url: tab.url,
          headers: [],
          queryParams: [],
          body: { type: 'none' },
          auth: { type: 'none' },
          proxy: { enabled: false, host: '', port: 0 },
          settings: { timeout: 30000, sslVerify: true, followRedirects: true, maxRedirects: 5 },
        });
      }
    }
  };

  const handleTabContext = (e: React.MouseEvent, index: number): void => {
    e.preventDefault();
    e.stopPropagation();
    setTabMenu({ x: e.clientX, y: e.clientY, index });
  };

  const handleCloseAll = (): void => {
    closeAllTabs();
    useRequestStore.getState().resetRequest();
    setTabMenu(null);
  };

  const handleCloseOthers = (): void => {
    if (tabMenu) {
      if (tabMenu.index !== activeTabIndex) {
        setActiveTab(tabMenu.index);
        const tab = tabs[tabMenu.index];
        if (tab) {
          useRequestStore.getState().loadRequest({
            id: tab.id, name: tab.name, method: tab.method, url: tab.url,
            headers: [], queryParams: [], body: { type: 'none' },
            auth: { type: 'none' },
            proxy: { enabled: false, host: '', port: 0 },
            settings: { timeout: 30000, sslVerify: true, followRedirects: true, maxRedirects: 5 },
          });
        }
      }
      closeOtherTabs(tabMenu.index);
    }
    setTabMenu(null);
  };

  const displayName = currentRequest.name || currentRequest.url || 'Untitled';
  const displayMethod = currentRequest.method;

  React.useEffect(() => {
    if (tabs[activeTabIndex]) {
      updateTab(activeTabIndex, {
        name: displayName,
        method: displayMethod,
        url: currentRequest.url,
      });
    }
  }, [displayName, displayMethod, currentRequest.url]);

  const handleAddTab = (): void => {
    if (tabs.length >= 10) {return;}
    addTab();
    useRequestStore.getState().resetRequest();
  };

  return (
    <>
      <style>{`
        @keyframes tabGradientFlow {
          0% { background-position: 0 0; }
          100% { background-position: 200px 0; }
        }
        .tab-active-border {
          position: relative;
        }
        .tab-active-border::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: repeating-linear-gradient(
            90deg,
            #0078d4 0%,
            #00bcf1 25%,
            #0078d4 50%,
            #00bcf1 75%,
            #0078d4 100%
          );
          background-size: 200px 100%;
          animation: tabGradientFlow 1.5s linear infinite;
          border-radius: 4px 4px 0 0;
        }
      `}</style>
      <div style={styles.tabBar}>
        <div style={styles.tabsContainer}>
          {tabs.map((tab, index) => {
            const isActive = index === activeTabIndex;
            return (
              <div
                key={tab.id}
                className={isActive ? 'tab-active-border' : ''}
                style={{
                  ...styles.tab,
                  ...(isActive ? styles.activeTab : styles.inactiveTab),
                }}
                onClick={() => handleTabClick(index)}
                onContextMenu={(e) => handleTabContext(e, index)}
              >
                <span style={styles.tabMethod}>{tab.method}</span>
                <span style={styles.tabName}>{tab.name || 'Untitled'}</span>
                {tabs.length > 1 && (
                  <button
                    style={styles.closeBtn}
                    onClick={(e) => handleClose(e, index)}
                    aria-label="Close tab"
                  >
                    x
                  </button>
                )}
              </div>
            );
          })}
          {tabs.length < 10 && (
            <button style={styles.addBtn} onClick={handleAddTab}>+</button>
          )}
        </div>
      </div>

      {tabMenu && (
        <div style={{ ...styles.contextMenu, left: tabMenu.x, top: tabMenu.y }}>
          <button onClick={handleCloseAll} style={styles.menuItem}>
            Close All
          </button>
          {tabs.length > 1 && (
            <button onClick={handleCloseOthers} style={styles.menuItem}>
              Close Others
            </button>
          )}
        </div>
      )}
    </>
  );
};

const styles: Record<string, React.CSSProperties> = {
  tabBar: {
    display: 'flex',
    alignItems: 'center',
    borderBottom: '1px solid var(--vscode-panel-border)',
    backgroundColor: 'var(--vscode-editor-background)',
    padding: '0 4px',
    minHeight: '32px',
  },
  tabsContainer: {
    display: 'flex',
    alignItems: 'center',
    overflowX: 'auto',
    flex: 1,
    gap: '2px',
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    padding: '4px 8px',
    borderRadius: '4px 4px 0 0',
    cursor: 'pointer',
    fontSize: '11px',
    gap: '4px',
    maxWidth: '200px',
    minWidth: '80px',
    userSelect: 'none',
  },
  activeTab: {
    backgroundColor: 'var(--vscode-sideBar-background)',
    border: '1px solid var(--vscode-panel-border)',
    borderBottom: 'none',
    marginBottom: '-1px',
  },
  inactiveTab: {
    backgroundColor: 'var(--vscode-editor-background)',
    border: '1px solid var(--vscode-panel-border)',
  },
  tabMethod: {
    fontWeight: 'bold',
    color: 'var(--vscode-textLink-foreground)',
    fontSize: '9px',
    minWidth: '32px',
  },
  tabName: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    flex: 1,
    color: 'var(--vscode-foreground)',
  },
  closeBtn: {
    padding: '0 2px',
    backgroundColor: 'transparent',
    color: 'var(--vscode-descriptionForeground)',
    border: 'none',
    cursor: 'pointer',
    fontSize: '11px',
    lineHeight: 1,
  },
  addBtn: {
    padding: '2px 8px',
    backgroundColor: 'transparent',
    color: 'var(--vscode-textLink-foreground)',
    border: '1px dashed var(--vscode-panel-border)',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    marginLeft: '4px',
  },
  contextMenu: {
    position: 'fixed',
    zIndex: 1000,
    background: 'var(--vscode-menu-background)',
    border: '1px solid var(--vscode-menu-border)',
    borderRadius: '4px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
    minWidth: '130px',
    padding: '4px 0',
  },
  menuItem: {
    display: 'block',
    width: '100%',
    padding: '4px 12px',
    fontSize: '11px',
    border: 'none',
    background: 'none',
    color: 'var(--vscode-menu-foreground)',
    cursor: 'pointer',
    textAlign: 'left' as const,
  },
};

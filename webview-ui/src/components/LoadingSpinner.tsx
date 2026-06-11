import React from 'react';

export const LoadingSpinner: React.FC = () => {
  return (
    <div style={styles.container}>
      <div style={styles.spinner} />
      <p style={styles.text}>Sending request...</p>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
    color: 'var(--vscode-descriptionForeground)',
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid var(--vscode-panel-border)',
    borderTopColor: 'var(--vscode-button-background)',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  text: {
    marginTop: '12px',
    fontSize: '13px',
  },
};
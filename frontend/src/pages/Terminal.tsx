import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createTerminal, closeTerminal, clearToken } from '../services/api';
import XTerminal from '../components/XTerminal';
import './Terminal.css';

interface TerminalTab {
  id: string;
  sessionId: string;
  label: string;
}

export default function Terminal() {
  const [tabs, setTabs] = useState<TerminalTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [showFiles, setShowFiles] = useState(false);
  const navigate = useNavigate();

  // Create first terminal on mount
  useEffect(() => {
    handleNewTerminal();
  }, []);

  const handleNewTerminal = async () => {
    try {
      const { sessionId } = await createTerminal();
      const tabId = `tab-${Date.now()}`;
      const newTab: TerminalTab = {
        id: tabId,
        sessionId,
        label: `Terminal ${tabs.length + 1}`,
      };

      setTabs((prev) => [...prev, newTab]);
      setActiveTabId(tabId);
    } catch (err: any) {
      console.error('Failed to create terminal:', err);
      alert('Failed to create terminal: ' + err.message);
    }
  };

  const handleCloseTab = async (tabId: string, sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      await closeTerminal(sessionId);
    } catch (err) {
      console.error('Failed to close terminal:', err);
    }

    setTabs((prev) => {
      const newTabs = prev.filter((tab) => tab.id !== tabId);

      // If closing active tab, switch to another tab
      if (activeTabId === tabId && newTabs.length > 0) {
        setActiveTabId(newTabs[newTabs.length - 1].id);
      }

      return newTabs;
    });
  };

  const handleLogout = () => {
    clearToken();
    navigate('/login');
  };

  const activeTab = tabs.find((tab) => tab.id === activeTabId);

  return (
    <div className="terminal-page">
      {/* Header */}
      <div className="terminal-header">
        <div className="header-left">
          <h1 className="header-title">PowerConnect</h1>
        </div>
        <div className="header-right">
          <button
            className="header-button"
            onClick={() => setShowFiles(!showFiles)}
            title="Toggle Files"
          >
            📁 Files
          </button>
          <button
            className="header-button"
            onClick={handleLogout}
            title="Logout"
          >
            🚪 Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="terminal-content">
        {/* File Explorer (optional toggle) */}
        {showFiles && (
          <div className="file-panel">
            <iframe
              src="/files"
              style={{ width: '100%', height: '100%', border: 'none' }}
              title="File Explorer"
            />
          </div>
        )}

        {/* Terminal Area */}
        <div className="terminal-area">
          {/* Tab Bar */}
          <div className="tab-bar">
            <div className="tabs">
              {tabs.map((tab) => (
                <div
                  key={tab.id}
                  className={`tab ${activeTabId === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTabId(tab.id)}
                >
                  <span className="tab-label">{tab.label}</span>
                  <button
                    className="tab-close"
                    onClick={(e) => handleCloseTab(tab.id, tab.sessionId, e)}
                    title="Close"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <button
              className="new-tab-button"
              onClick={handleNewTerminal}
              title="New Terminal"
            >
              +
            </button>
          </div>

          {/* Terminal Display */}
          <div className="terminal-display">
            {activeTab ? (
              <XTerminal
                key={activeTab.sessionId}
                sessionId={activeTab.sessionId}
                onClose={() => handleCloseTab(activeTab.id, activeTab.sessionId, {} as any)}
              />
            ) : (
              <div className="no-terminal">
                <p>No terminal open</p>
                <button onClick={handleNewTerminal} className="create-terminal-button">
                  Create Terminal
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

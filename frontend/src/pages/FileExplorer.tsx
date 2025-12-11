import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { listDirectory, clearToken } from '../services/api';
import FileList from '../components/FileList';
import './FileExplorer.css';

export default function FileExplorer() {
  const [currentPath, setCurrentPath] = useState('/');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadDirectory(currentPath);
  }, [currentPath]);

  const loadDirectory = async (path: string) => {
    setLoading(true);
    setError('');

    try {
      const data = await listDirectory(path);
      setItems(data.items);
      setCurrentPath(data.path);
    } catch (err: any) {
      setError(err.message || 'Failed to load directory');
      console.error('Failed to load directory:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (itemName: string, itemType: string) => {
    if (itemType === 'directory') {
      const newPath = currentPath === '/'
        ? `/${itemName}`
        : `${currentPath}/${itemName}`;
      setCurrentPath(newPath);
    }
  };

  const handleGoUp = () => {
    if (currentPath === '/') return;
    const parts = currentPath.split('/').filter(Boolean);
    parts.pop();
    setCurrentPath(parts.length === 0 ? '/' : '/' + parts.join('/'));
  };

  const handleGoHome = () => {
    setCurrentPath('/');
  };

  const handleLogout = () => {
    clearToken();
    navigate('/login');
  };

  const pathParts = currentPath.split('/').filter(Boolean);

  return (
    <div className="file-explorer">
      {/* Header */}
      <div className="file-header">
        <div className="header-left">
          <h1 className="header-title">File Explorer</h1>
        </div>
        <div className="header-right">
          <button
            className="header-button"
            onClick={() => navigate('/terminal')}
            title="Terminal"
          >
            💻 Terminal
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

      {/* Breadcrumb */}
      <div className="breadcrumb">
        <button className="breadcrumb-button" onClick={handleGoHome}>
          🏠 Home
        </button>
        {pathParts.map((part, index) => (
          <span key={index} className="breadcrumb-item">
            <span className="breadcrumb-separator">/</span>
            <button
              className="breadcrumb-button"
              onClick={() => {
                const newPath = '/' + pathParts.slice(0, index + 1).join('/');
                setCurrentPath(newPath);
              }}
            >
              {part}
            </button>
          </span>
        ))}
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <button
          className="toolbar-button"
          onClick={handleGoUp}
          disabled={currentPath === '/'}
          title="Go up"
        >
          ⬆️ Up
        </button>
        <button
          className="toolbar-button"
          onClick={() => loadDirectory(currentPath)}
          title="Refresh"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Content */}
      <div className="file-content">
        {loading && <div className="loading">Loading...</div>}

        {error && (
          <div className="error-container">
            <p className="error-text">{error}</p>
            <button onClick={() => loadDirectory(currentPath)} className="retry-button">
              Retry
            </button>
          </div>
        )}

        {!loading && !error && (
          <FileList
            items={items}
            currentPath={currentPath}
            onNavigate={handleNavigate}
            onRefresh={() => loadDirectory(currentPath)}
          />
        )}
      </div>
    </div>
  );
}

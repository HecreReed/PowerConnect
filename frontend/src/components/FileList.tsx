interface FileListProps {
  items: Array<{
    name: string;
    type: 'file' | 'directory';
    size: number;
    mtime: number;
  }>;
  currentPath: string;
  onNavigate: (name: string, type: string) => void;
  onRefresh: () => void;
}

export default function FileList({ items, currentPath, onNavigate }: FileListProps) {
  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const handleDownload = (itemName: string) => {
    const filePath = currentPath === '/'
      ? `/${itemName}`
      : `${currentPath}/${itemName}`;

    const token = localStorage.getItem('token');
    const downloadUrl = `/api/fs/download?path=${encodeURIComponent(filePath)}&token=${token}`;

    // Create temporary link and trigger download
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = itemName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (items.length === 0) {
    return (
      <div className="empty-directory">
        <p>This directory is empty</p>
      </div>
    );
  }

  return (
    <div className="file-list">
      {/* Desktop table view */}
      <table className="file-table desktop-only">
        <thead>
          <tr>
            <th className="col-icon"></th>
            <th className="col-name">Name</th>
            <th className="col-size">Size</th>
            <th className="col-date">Modified</th>
            <th className="col-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr
              key={index}
              className="file-row"
              onClick={() => {
                if (item.type === 'directory') {
                  onNavigate(item.name, item.type);
                }
              }}
              style={{ cursor: item.type === 'directory' ? 'pointer' : 'default' }}
            >
              <td className="col-icon">
                {item.type === 'directory' ? '📁' : '📄'}
              </td>
              <td className="col-name">{item.name}</td>
              <td className="col-size">
                {item.type === 'file' ? formatSize(item.size) : '-'}
              </td>
              <td className="col-date">{formatDate(item.mtime)}</td>
              <td className="col-actions">
                {item.type === 'file' && (
                  <button
                    className="action-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(item.name);
                    }}
                    title="Download"
                  >
                    ⬇️
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mobile card view */}
      <div className="file-cards mobile-only">
        {items.map((item, index) => (
          <div
            key={index}
            className="file-card"
            onClick={() => {
              if (item.type === 'directory') {
                onNavigate(item.name, item.type);
              }
            }}
          >
            <div className="card-icon">
              {item.type === 'directory' ? '📁' : '📄'}
            </div>
            <div className="card-info">
              <div className="card-name">{item.name}</div>
              <div className="card-meta">
                {item.type === 'file' && (
                  <span className="card-size">{formatSize(item.size)}</span>
                )}
                <span className="card-date">{formatDate(item.mtime)}</span>
              </div>
            </div>
            {item.type === 'file' && (
              <button
                className="card-action"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload(item.name);
                }}
                title="Download"
              >
                ⬇️
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

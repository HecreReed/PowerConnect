/**
 * API service for backend communication
 */

const API_BASE = import.meta.env?.PROD ? '' : 'http://localhost:3000';

/**
 * Get auth token from localStorage
 */
export function getToken(): string | null {
  return localStorage.getItem('token');
}

/**
 * Set auth token in localStorage
 */
export function setToken(token: string): void {
  localStorage.setItem('token', token);
}

/**
 * Clear auth token from localStorage
 */
export function clearToken(): void {
  localStorage.removeItem('token');
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!getToken();
}

/**
 * Make authenticated API request
 */
async function fetchAPI(url: string, options: RequestInit = {}) {
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    clearToken();
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || 'Request failed');
  }

  return response;
}

/**
 * Login
 */
export async function login(username: string, password: string): Promise<{ token: string; expiresIn: string }> {
  const response = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Login failed' }));
    throw new Error(error.error || 'Login failed');
  }

  return response.json();
}

/**
 * Create terminal session
 */
export async function createTerminal(cwd?: string): Promise<{ sessionId: string; cwd: string }> {
  const response = await fetchAPI('/api/terminal', {
    method: 'POST',
    body: JSON.stringify({ cwd }),
  });

  return response.json();
}

/**
 * Close terminal session
 */
export async function closeTerminal(sessionId: string): Promise<void> {
  await fetchAPI(`/api/terminal/${sessionId}`, {
    method: 'DELETE',
  });
}

/**
 * List terminal sessions
 */
export async function listTerminals(): Promise<any[]> {
  const response = await fetchAPI('/api/terminal/list');
  const data = await response.json();
  return data.sessions;
}

/**
 * List directory contents
 */
export async function listDirectory(path: string): Promise<{
  path: string;
  items: Array<{
    name: string;
    type: 'file' | 'directory';
    size: number;
    mtime: number;
  }>;
}> {
  const response = await fetchAPI(`/api/fs/list?path=${encodeURIComponent(path)}`);
  return response.json();
}

/**
 * Get download URL for a file
 */
export function getDownloadUrl(path: string): string {
  const token = getToken();
  return `${API_BASE}/api/fs/download?path=${encodeURIComponent(path)}&token=${token}`;
}

/**
 * Create directory
 */
export async function createDirectory(path: string): Promise<void> {
  await fetchAPI('/api/fs/mkdir', {
    method: 'POST',
    body: JSON.stringify({ path }),
  });
}

/**
 * Delete file or directory
 */
export async function deleteFile(path: string): Promise<void> {
  await fetchAPI('/api/fs/delete', {
    method: 'POST',
    body: JSON.stringify({ path }),
  });
}

/**
 * Rename file or directory
 */
export async function renameFile(oldPath: string, newPath: string): Promise<void> {
  await fetchAPI('/api/fs/rename', {
    method: 'POST',
    body: JSON.stringify({ oldPath, newPath }),
  });
}

/**
 * Get WebSocket URL for terminal
 */
export function getTerminalWebSocketUrl(sessionId: string): string {
  const token = getToken();
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsHost = import.meta.env?.PROD ? window.location.host : 'localhost:3000';
  return `${wsProtocol}//${wsHost}/ws/terminal/${sessionId}?token=${token}`;
}

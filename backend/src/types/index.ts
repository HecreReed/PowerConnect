import { IPty } from 'node-pty';

/**
 * Terminal session metadata
 */
export interface TerminalSession {
  sessionId: string;
  pty: IPty;
  cwd: string;
  createdAt: number;
  lastActivity: number;
}

/**
 * File system item
 */
export interface FileSystemItem {
  name: string;
  type: 'file' | 'directory';
  size: number;
  mtime: number;
}

/**
 * API response for file listing
 */
export interface FileListResponse {
  path: string;
  items: FileSystemItem[];
}

/**
 * Terminal creation request
 */
export interface CreateTerminalRequest {
  cwd?: string;
}

/**
 * Terminal creation response
 */
export interface CreateTerminalResponse {
  sessionId: string;
  cwd: string;
}

/**
 * Login request
 */
export interface LoginRequest {
  username: string;
  password: string;
}

/**
 * Login response
 */
export interface LoginResponse {
  token: string;
  expiresIn: string;
}

/**
 * Session list item
 */
export interface SessionListItem {
  sessionId: string;
  cwd: string;
  createdAt: number;
  lastActivity: number;
}

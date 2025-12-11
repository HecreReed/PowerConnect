import * as fs from 'fs/promises';
import * as path from 'path';
import { config } from '../config';
import { FileSystemItem } from '../types';

/**
 * File system service with security restrictions
 */
export class FileSystemService {
  private rootDir: string;

  constructor() {
    this.rootDir = path.resolve(config.fsRootDir);
    console.log(`📁 File System Service initialized (root: ${this.rootDir})`);
  }

  /**
   * Resolve and validate path
   * Ensures path is within root directory
   */
  private resolvePath(requestedPath: string): string {
    // Remove leading slash and resolve relative to root
    const normalizedPath = requestedPath.startsWith('/')
      ? requestedPath.slice(1)
      : requestedPath;

    const resolved = path.resolve(this.rootDir, normalizedPath);

    // Check if path is within root directory (prevent path traversal)
    if (!resolved.startsWith(this.rootDir)) {
      throw new Error('Access denied: Path is outside root directory');
    }

    return resolved;
  }

  /**
   * List directory contents
   */
  async listDirectory(requestedPath: string): Promise<FileSystemItem[]> {
    const absolutePath = this.resolvePath(requestedPath);

    try {
      const entries = await fs.readdir(absolutePath, { withFileTypes: true });

      const items: FileSystemItem[] = await Promise.all(
        entries.map(async (entry) => {
          const fullPath = path.join(absolutePath, entry.name);
          let stats;

          try {
            stats = await fs.stat(fullPath);
          } catch (err) {
            // If stat fails (e.g., broken symlink), skip this entry
            return null;
          }

          return {
            name: entry.name,
            type: entry.isDirectory() ? 'directory' as const : 'file' as const,
            size: stats.size,
            mtime: stats.mtimeMs,
          };
        })
      );

      // Filter out null entries and sort: directories first, then files
      const filtered = items.filter((item): item is FileSystemItem => item !== null);

      return filtered.sort((a, b) => {
        // Directories first
        if (a.type !== b.type) {
          return a.type === 'directory' ? -1 : 1;
        }
        // Then alphabetically
        return a.name.localeCompare(b.name);
      });
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        throw new Error('Directory not found');
      }
      if (err.code === 'EACCES') {
        throw new Error('Permission denied');
      }
      if (err.code === 'ENOTDIR') {
        throw new Error('Not a directory');
      }
      throw err;
    }
  }

  /**
   * Get file info
   */
  async getFileInfo(requestedPath: string) {
    const absolutePath = this.resolvePath(requestedPath);

    try {
      const stats = await fs.stat(absolutePath);
      return {
        path: absolutePath,
        size: stats.size,
        isDirectory: stats.isDirectory(),
        isFile: stats.isFile(),
        mtime: stats.mtimeMs,
      };
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        throw new Error('File not found');
      }
      throw err;
    }
  }

  /**
   * Create directory
   */
  async createDirectory(requestedPath: string): Promise<void> {
    const absolutePath = this.resolvePath(requestedPath);

    try {
      await fs.mkdir(absolutePath, { recursive: true });
    } catch (err: any) {
      if (err.code === 'EEXIST') {
        throw new Error('Directory already exists');
      }
      throw err;
    }
  }

  /**
   * Delete file or directory
   */
  async delete(requestedPath: string): Promise<void> {
    const absolutePath = this.resolvePath(requestedPath);

    // Prevent deleting root directory
    if (absolutePath === this.rootDir) {
      throw new Error('Cannot delete root directory');
    }

    try {
      const stats = await fs.stat(absolutePath);

      if (stats.isDirectory()) {
        await fs.rm(absolutePath, { recursive: true, force: true });
      } else {
        await fs.unlink(absolutePath);
      }
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        throw new Error('File or directory not found');
      }
      throw err;
    }
  }

  /**
   * Rename/move file or directory
   */
  async rename(oldPath: string, newPath: string): Promise<void> {
    const oldAbsolutePath = this.resolvePath(oldPath);
    const newAbsolutePath = this.resolvePath(newPath);

    try {
      await fs.rename(oldAbsolutePath, newAbsolutePath);
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        throw new Error('Source file or directory not found');
      }
      if (err.code === 'EEXIST') {
        throw new Error('Destination already exists');
      }
      throw err;
    }
  }

  /**
   * Get absolute path for download
   */
  getAbsolutePath(requestedPath: string): string {
    return this.resolvePath(requestedPath);
  }

  /**
   * Get root directory
   */
  getRootDir(): string {
    return this.rootDir;
  }
}

// Singleton instance
export const fsService = new FileSystemService();

import * as pty from 'node-pty';
import { v4 as uuidv4 } from 'uuid';
import { TerminalSession, CreateTerminalRequest, SessionListItem } from '../types';
import { config } from '../config';
import * as os from 'os';

/**
 * Terminal session manager
 * Manages all active terminal sessions
 */
export class TerminalManager {
  private sessions: Map<string, TerminalSession> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Start cleanup task for inactive sessions
    this.cleanupInterval = setInterval(() => {
      this.cleanupInactiveSessions();
    }, 60000); // Check every minute

    console.log('✅ Terminal Manager initialized');
  }

  /**
   * Create a new terminal session
   */
  createSession(params: CreateTerminalRequest = {}): TerminalSession {
    const sessionId = uuidv4();
    const cwd = params.cwd || config.fsRootDir;

    // Create PTY instance
    const ptyProcess = pty.spawn(config.defaultShell, [], {
      name: 'xterm-256color',
      cols: 80,
      rows: 30,
      cwd: cwd,
      env: process.env as { [key: string]: string },
    });

    const session: TerminalSession = {
      sessionId,
      pty: ptyProcess,
      cwd,
      createdAt: Date.now(),
      lastActivity: Date.now(),
    };

    this.sessions.set(sessionId, session);

    console.log(`📟 Terminal session created: ${sessionId} (cwd: ${cwd})`);

    // Handle PTY exit
    ptyProcess.onExit(({ exitCode, signal }) => {
      console.log(`📟 Terminal session exited: ${sessionId} (code: ${exitCode}, signal: ${signal})`);
      this.destroySession(sessionId);
    });

    return session;
  }

  /**
   * Get a session by ID
   */
  getSession(sessionId: string): TerminalSession | undefined {
    const session = this.sessions.get(sessionId);
    if (session) {
      // Update last activity
      session.lastActivity = Date.now();
    }
    return session;
  }

  /**
   * Destroy a session
   */
  destroySession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }

    try {
      // Kill the PTY process
      session.pty.kill();
    } catch (err) {
      console.error(`Error killing PTY for session ${sessionId}:`, err);
    }

    this.sessions.delete(sessionId);
    console.log(`🗑️  Terminal session destroyed: ${sessionId}`);
    return true;
  }

  /**
   * Get all active sessions
   */
  listSessions(): SessionListItem[] {
    return Array.from(this.sessions.values()).map(session => ({
      sessionId: session.sessionId,
      cwd: session.cwd,
      createdAt: session.createdAt,
      lastActivity: session.lastActivity,
    }));
  }

  /**
   * Write data to a terminal session
   */
  writeToSession(sessionId: string, data: string): boolean {
    const session = this.getSession(sessionId);
    if (!session) {
      return false;
    }

    try {
      session.pty.write(data);
      return true;
    } catch (err) {
      console.error(`Error writing to session ${sessionId}:`, err);
      return false;
    }
  }

  /**
   * Resize a terminal session
   */
  resizeSession(sessionId: string, cols: number, rows: number): boolean {
    const session = this.getSession(sessionId);
    if (!session) {
      return false;
    }

    try {
      session.pty.resize(cols, rows);
      return true;
    } catch (err) {
      console.error(`Error resizing session ${sessionId}:`, err);
      return false;
    }
  }

  /**
   * Clean up inactive sessions
   */
  private cleanupInactiveSessions(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.lastActivity > config.sessionTimeout) {
        console.log(`⏰ Session ${sessionId} timed out, cleaning up...`);
        this.destroySession(sessionId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 Cleaned up ${cleaned} inactive session(s)`);
    }
  }

  /**
   * Cleanup on shutdown
   */
  destroy(): void {
    clearInterval(this.cleanupInterval);

    // Kill all sessions
    for (const sessionId of this.sessions.keys()) {
      this.destroySession(sessionId);
    }

    console.log('🛑 Terminal Manager destroyed');
  }
}

// Singleton instance
export const terminalManager = new TerminalManager();

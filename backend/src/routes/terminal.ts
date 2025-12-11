import { FastifyInstance } from 'fastify';
import { SocketStream } from '@fastify/websocket';
import { terminalManager } from '../services/terminalManager';
import { CreateTerminalRequest, CreateTerminalResponse } from '../types';

/**
 * Terminal routes
 */
export async function terminalRoutes(fastify: FastifyInstance) {
  /**
   * POST /api/terminal
   * Create a new terminal session
   */
  fastify.post<{
    Body: CreateTerminalRequest;
    Reply: CreateTerminalResponse;
  }>('/api/terminal', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    const { cwd } = request.body;

    try {
      const session = terminalManager.createSession({ cwd });

      return reply.send({
        sessionId: session.sessionId,
        cwd: session.cwd,
      });
    } catch (err) {
      console.error('Error creating terminal:', err);
      return reply.code(500).send({
        error: 'Failed to create terminal session'
      });
    }
  });

  /**
   * DELETE /api/terminal/:sessionId
   * Close a terminal session
   */
  fastify.delete<{
    Params: { sessionId: string };
  }>('/api/terminal/:sessionId', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    const { sessionId } = request.params;

    const success = terminalManager.destroySession(sessionId);

    if (!success) {
      return reply.code(404).send({
        error: 'Session not found'
      });
    }

    return reply.send({ success: true });
  });

  /**
   * GET /api/terminal/list
   * List all active terminal sessions
   */
  fastify.get('/api/terminal/list', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    const sessions = terminalManager.listSessions();
    return reply.send({ sessions });
  });

  /**
   * WebSocket /ws/terminal/:sessionId
   * Terminal WebSocket connection
   */
  fastify.get<{
    Params: { sessionId: string };
    Querystring: { token: string };
  }>('/ws/terminal/:sessionId', {
    websocket: true
  }, async (connection: SocketStream, request) => {
    const { sessionId } = request.params;
    const { token } = request.query;

    // Verify JWT token from query string
    try {
      await fastify.jwt.verify(token);
    } catch (err) {
      connection.socket.close(1008, 'Unauthorized');
      return;
    }

    // Get terminal session
    const session = terminalManager.getSession(sessionId);
    if (!session) {
      connection.socket.close(1008, 'Session not found');
      return;
    }

    console.log(`🔌 WebSocket connected for session: ${sessionId}`);

    // Handle PTY output -> WebSocket
    const onData = (data: string) => {
      try {
        connection.socket.send(data);
      } catch (err) {
        console.error('Error sending data to WebSocket:', err);
      }
    };
    session.pty.onData(onData);

    // Handle WebSocket -> PTY input
    connection.socket.on('message', (data: Buffer) => {
      try {
        session.pty.write(data.toString());
      } catch (err) {
        console.error('Error writing to PTY:', err);
      }
    });

    // Handle WebSocket close
    connection.socket.on('close', () => {
      console.log(`🔌 WebSocket disconnected for session: ${sessionId}`);
      // Don't destroy session on disconnect, allow reconnection
    });

    // Handle errors
    connection.socket.on('error', (err) => {
      console.error(`WebSocket error for session ${sessionId}:`, err);
    });
  });
}

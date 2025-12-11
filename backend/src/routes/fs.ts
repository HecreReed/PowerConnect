import { FastifyInstance } from 'fastify';
import { fsService } from '../services/fsService';
import { FileListResponse } from '../types';
import * as path from 'path';

/**
 * File system routes
 */
export async function fsRoutes(fastify: FastifyInstance) {
  /**
   * GET /api/fs/list?path=/xxx
   * List directory contents
   */
  fastify.get<{
    Querystring: { path?: string };
    Reply: FileListResponse | { error: string };
  }>('/api/fs/list', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    const requestedPath = request.query.path || '/';

    try {
      const items = await fsService.listDirectory(requestedPath);

      return reply.send({
        path: requestedPath,
        items,
      });
    } catch (err: any) {
      console.error('Error listing directory:', err);
      return reply.code(400).send({
        error: err.message || 'Failed to list directory'
      });
    }
  });

  /**
   * GET /api/fs/download?path=/xxx
   * Download a file
   */
  fastify.get<{
    Querystring: { path: string };
  }>('/api/fs/download', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    const requestedPath = request.query.path;

    if (!requestedPath) {
      return reply.code(400).send({
        error: 'Path parameter is required'
      });
    }

    try {
      // Get file info first
      const fileInfo = await fsService.getFileInfo(requestedPath);

      if (fileInfo.isDirectory) {
        return reply.code(400).send({
          error: 'Cannot download a directory'
        });
      }

      // Get absolute path
      const absolutePath = fsService.getAbsolutePath(requestedPath);
      const fileName = path.basename(absolutePath);

      // Set headers for download
      reply.header('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
      reply.header('Content-Type', 'application/octet-stream');

      // Send file
      return reply.sendFile(path.basename(absolutePath), path.dirname(absolutePath));
    } catch (err: any) {
      console.error('Error downloading file:', err);
      return reply.code(400).send({
        error: err.message || 'Failed to download file'
      });
    }
  });

  /**
   * POST /api/fs/mkdir
   * Create a directory
   */
  fastify.post<{
    Body: { path: string };
  }>('/api/fs/mkdir', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    const { path: requestedPath } = request.body;

    if (!requestedPath) {
      return reply.code(400).send({
        error: 'Path is required'
      });
    }

    try {
      await fsService.createDirectory(requestedPath);
      return reply.send({ success: true });
    } catch (err: any) {
      console.error('Error creating directory:', err);
      return reply.code(400).send({
        error: err.message || 'Failed to create directory'
      });
    }
  });

  /**
   * POST /api/fs/delete
   * Delete a file or directory
   */
  fastify.post<{
    Body: { path: string };
  }>('/api/fs/delete', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    const { path: requestedPath } = request.body;

    if (!requestedPath) {
      return reply.code(400).send({
        error: 'Path is required'
      });
    }

    try {
      await fsService.delete(requestedPath);
      return reply.send({ success: true });
    } catch (err: any) {
      console.error('Error deleting:', err);
      return reply.code(400).send({
        error: err.message || 'Failed to delete'
      });
    }
  });

  /**
   * POST /api/fs/rename
   * Rename/move a file or directory
   */
  fastify.post<{
    Body: { oldPath: string; newPath: string };
  }>('/api/fs/rename', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    const { oldPath, newPath } = request.body;

    if (!oldPath || !newPath) {
      return reply.code(400).send({
        error: 'Both oldPath and newPath are required'
      });
    }

    try {
      await fsService.rename(oldPath, newPath);
      return reply.send({ success: true });
    } catch (err: any) {
      console.error('Error renaming:', err);
      return reply.code(400).send({
        error: err.message || 'Failed to rename'
      });
    }
  });

  /**
   * GET /api/fs/info?path=/xxx
   * Get file/directory information
   */
  fastify.get<{
    Querystring: { path: string };
  }>('/api/fs/info', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    const requestedPath = request.query.path;

    if (!requestedPath) {
      return reply.code(400).send({
        error: 'Path parameter is required'
      });
    }

    try {
      const info = await fsService.getFileInfo(requestedPath);
      return reply.send(info);
    } catch (err: any) {
      console.error('Error getting file info:', err);
      return reply.code(400).send({
        error: err.message || 'Failed to get file info'
      });
    }
  });
}

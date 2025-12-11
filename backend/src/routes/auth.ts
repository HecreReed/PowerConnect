import { FastifyInstance } from 'fastify';
import { LoginRequest, LoginResponse } from '../types';
import { config } from '../config';

/**
 * Authentication routes
 */
export async function authRoutes(fastify: FastifyInstance) {
  /**
   * POST /api/auth/login
   * Authenticate user and return JWT token
   */
  fastify.post<{
    Body: LoginRequest;
    Reply: LoginResponse | { error: string };
  }>('/api/auth/login', async (request, reply) => {
    const { username, password } = request.body;

    // Validate credentials
    if (username !== config.username || password !== config.password) {
      return reply.code(401).send({
        error: 'Invalid username or password'
      });
    }

    // Generate JWT token
    const token = fastify.jwt.sign(
      { username },
      { expiresIn: config.jwtExpiresIn }
    );

    return reply.send({
      token,
      expiresIn: config.jwtExpiresIn,
    });
  });

  /**
   * GET /api/auth/verify
   * Verify if token is valid
   */
  fastify.get('/api/auth/verify', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    return reply.send({
      valid: true,
      user: request.user
    });
  });
}

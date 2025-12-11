import { FastifyRequest, FastifyReply } from 'fastify';

/**
 * JWT authentication middleware
 * Verifies JWT token and attaches decoded payload to request
 */
export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    // Verify JWT token
    await request.jwtVerify();
  } catch (err) {
    reply.code(401).send({
      error: 'Unauthorized',
      message: 'Invalid or missing authentication token'
    });
  }
}

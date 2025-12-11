import { createServer } from './server';
import { config } from './config';
import { terminalManager } from './services/terminalManager';

/**
 * Start the server
 */
async function start() {
  try {
    console.log('🚀 Starting PowerConnect Backend...\n');

    const server = await createServer();

    // Start listening
    await server.listen({
      port: config.port,
      host: config.host,
    });

    console.log(`\n✅ Server is running!`);
    console.log(`📍 Local: http://localhost:${config.port}`);
    console.log(`📍 Network: http://${config.host}:${config.port}`);
    console.log(`\n🔐 Login credentials:`);
    console.log(`   Username: ${config.username}`);
    console.log(`   Password: ${config.password}`);
    console.log(`\n⚠️  Remember to change default credentials in production!\n`);

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      console.log(`\n${signal} received, shutting down gracefully...`);

      // Close server
      await server.close();

      // Cleanup terminal sessions
      terminalManager.destroy();

      console.log('👋 Server stopped');
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

// Start the server
start();

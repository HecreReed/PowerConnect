import * as dotenv from 'dotenv';
import * as path from 'path';
import * as os from 'os';

// Load environment variables
dotenv.config();

/**
 * Application configuration
 */
export const config = {
  // Server
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || '0.0.0.0',

  // Authentication
  jwtSecret: process.env.JWT_SECRET || 'default-secret-change-this',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  username: process.env.USERNAME || 'admin',
  password: process.env.PASSWORD || 'admin',

  // File System
  fsRootDir: process.env.FS_ROOT_DIR || os.homedir(),

  // Terminal
  defaultShell: process.env.DEFAULT_SHELL || (
    process.platform === 'win32' ? 'powershell.exe' :
    process.env.SHELL || '/bin/bash'
  ),
  sessionTimeout: parseInt(process.env.SESSION_TIMEOUT || '30', 10) * 60 * 1000, // Convert to ms

  // CORS
  corsOrigin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'],
} as const;

// Validation
if (config.jwtSecret === 'default-secret-change-this') {
  console.warn('⚠️  WARNING: Using default JWT secret! Please set JWT_SECRET in .env file');
}

if (config.password === 'admin') {
  console.warn('⚠️  WARNING: Using default password! Please set PASSWORD in .env file');
}

console.log('📝 Configuration loaded:');
console.log(`   Port: ${config.port}`);
console.log(`   Host: ${config.host}`);
console.log(`   File System Root: ${config.fsRootDir}`);
console.log(`   Default Shell: ${config.defaultShell}`);
console.log(`   Session Timeout: ${config.sessionTimeout / 60000} minutes`);

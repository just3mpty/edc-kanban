import express, { Express } from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import routes from './routes/index.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { apiLimiter, authLimiter, securityHeaders } from './middlewares/security.middleware.js';

/**
 * Creates and configures the Express application.
 * 
 * Sets up middleware (security headers, CORS, JSON parsing, rate limiting) and routes.
 * Error handler must be the last middleware.
 * Exported for use in server.ts and testing.
 * 
 * @returns Configured Express application
 * 
 * @example
 * ```typescript
 * import { createApp } from './app';
 * const app = createApp();
 * ```
 */
export function createApp(): Express {
  const app = express();

  // Middleware
  app.use(securityHeaders);
  app.use(cors({ origin: env.CORS_ORIGIN }));
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true }));

  // Request logging
  app.use((req, res, next) => {
    logger.info({ method: req.method, url: req.url }, 'Incoming request');
    next();
  });

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API routes
  app.use('/api', apiLimiter);
  app.use('/api/auth', authLimiter);
  app.use('/api', routes);

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
}


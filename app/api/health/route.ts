import { NextResponse } from 'next/server';
import { checkDatabaseHealth } from '@/lib/db';
import { webhookConfig } from '@/lib/webhook';

/**
 * GET /api/health
 * Health check endpoint for monitoring
 * 
 * Returns:
 *   - Database connection status
 *   - Webhook configuration
 *   - System timestamp
 */
export async function GET() {
  try {
    const dbHealth = await checkDatabaseHealth();
    
    return NextResponse.json({
      status: dbHealth.healthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        database: {
          healthy: dbHealth.healthy,
          message: dbHealth.message,
        },
        webhook: {
          configured: webhookConfig.url !== 'http://birger-macbook:18789/webhook/task' || process.env.NODE_ENV === 'development',
          url: webhookConfig.url,
          timeout: webhookConfig.timeout,
        },
      },
      environment: process.env.NODE_ENV || 'development',
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

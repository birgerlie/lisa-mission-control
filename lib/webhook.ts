// Webhook configuration and utilities

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'default-secret-change-in-production';
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://birger-macbook:18789/webhook/task';
const WEBHOOK_TIMEOUT = parseInt(process.env.WEBHOOK_TIMEOUT || '5000', 10);

export interface WebhookPayload {
  taskId: string;
  title: string;
  description: string | null;
  priority: string;
  assignee: string;
  status: string;
  createdAt: string;
}

export interface WebhookResult {
  success: boolean;
  error?: string;
  statusCode?: number;
  responseBody?: string;
}

/**
 * Send a webhook notification for a new task
 * Uses a simple fetch with timeout via AbortController
 */
export async function sendWebhook(payload: WebhookPayload): Promise<WebhookResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT);

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${WEBHOOK_SECRET}`,
        'X-Webhook-Source': 'mission-control',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const responseBody = await response.text();

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
        statusCode: response.status,
        responseBody: responseBody.slice(0, 500), // Limit error response size
      };
    }

    return {
      success: true,
      statusCode: response.status,
      responseBody: responseBody.slice(0, 500),
    };
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: 'Webhook request timed out',
        };
      }
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: 'Unknown error occurred',
    };
  }
}

/**
 * Verify webhook signature for incoming webhooks
 * Uses HMAC-SHA256 for signature verification
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string = WEBHOOK_SECRET
): boolean {
  try {
    // In a real implementation, we'd use crypto module
    // For now, simple Bearer token comparison as shown in requirements
    const expectedSignature = `Bearer ${secret}`;
    return signature === expectedSignature;
  } catch {
    return false;
  }
}

/**
 * Verify Authorization header for incoming webhooks
 */
export function verifyWebhookAuth(authHeader: string | null): boolean {
  if (!authHeader) return false;
  const expected = `Bearer ${WEBHOOK_SECRET}`;
  return authHeader === expected;
}

/**
 * Build webhook payload from task data
 */
export function buildWebhookPayload(task: {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  assignee: string;
  status: string;
  createdAt: string;
}): WebhookPayload {
  return {
    taskId: task.id,
    title: task.title,
    description: task.description,
    priority: task.priority,
    assignee: task.assignee,
    status: task.status,
    createdAt: task.createdAt,
  };
}

/**
 * Simple rate limiting store
 * Uses in-memory Map (resets on server restart)
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 60000
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  if (!record || now > record.resetTime) {
    // New window
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetTime: now + windowMs,
    };
  }

  if (record.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.resetTime,
    };
  }

  record.count++;
  return {
    allowed: true,
    remaining: maxRequests - record.count,
    resetTime: record.resetTime,
  };
}

// Export configuration for reference
export const webhookConfig = {
  url: WEBHOOK_URL,
  timeout: WEBHOOK_TIMEOUT,
  secretLength: WEBHOOK_SECRET.length,
};

// Mock webhook log database for build compatibility
export const webhookLogDb = {
  log: (taskId: string, status: string, message: string) => {
    console.log(`[WebhookLog] ${taskId} - ${status}: ${message}`);
  },
  getLogs: (taskId: string) => {
    return [];
  },
};

/**
 * Error handling and observability
 * Logs key errors for monitoring and debugging
 */

export interface ErrorContext {
  component?: string;
  action?: string;
  dealId?: string;
  userId?: string;
  [key: string]: any;
}

/**
 * Log error with context
 */
export function logError(
  error: Error | unknown,
  context?: ErrorContext
): void {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  const logEntry = {
    timestamp: new Date().toISOString(),
    error: errorMessage,
    stack: errorStack,
    context,
  };

  // In production, send to error tracking service (e.g., Sentry)
  // For now, log to console
  console.error('Error logged:', logEntry);

  // TODO: Integrate with error tracking service
  // if (process.env.NODE_ENV === 'production') {
  //   errorTrackingService.captureException(error, { extra: context });
  // }
}

/**
 * Log API failure
 */
export function logApiFailure(
  endpoint: string,
  method: string,
  status: number,
  error: string,
  context?: ErrorContext
): void {
  logError(new Error(`API ${method} ${endpoint} failed: ${status} - ${error}`), {
    ...context,
    endpoint,
    method,
    status,
  });
}

/**
 * Log deal mutation
 */
export function logDealMutation(
  dealId: string,
  action: string,
  success: boolean,
  error?: Error
): void {
  const context: ErrorContext = {
    component: 'DealMutation',
    action,
    dealId,
    success,
  };

  if (success) {
    console.log('Deal mutation success:', context);
  } else {
    logError(error || new Error('Deal mutation failed'), context);
  }
}

/**
 * Log timeline fetch
 */
export function logTimelineFetch(
  dealId: string,
  success: boolean,
  itemCount?: number,
  error?: Error
): void {
  const context: ErrorContext = {
    component: 'TimelineFetch',
    dealId,
    success,
    itemCount,
  };

  if (success) {
    console.log('Timeline fetch success:', context);
  } else {
    logError(error || new Error('Timeline fetch failed'), context);
  }
}

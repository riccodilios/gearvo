export type AppErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION'
  | 'CONFLICT'
  | 'RATE_LIMIT'
  | 'INTERNAL';

const USER_MESSAGES: Record<AppErrorCode, string> = {
  UNAUTHORIZED: 'Please sign in to continue.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested record was not found.',
  VALIDATION: 'Please check your input and try again.',
  CONFLICT: 'This action conflicts with the current state of the data.',
  RATE_LIMIT: 'Too many requests. Please wait a moment and try again.',
  INTERNAL: 'Something went wrong. Please try again.',
};

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly userMessage: string;
  readonly status: number;
  readonly details?: unknown;

  constructor(
    code: AppErrorCode,
    userMessage?: string,
    options?: { cause?: unknown; details?: unknown; status?: number }
  ) {
    super(userMessage ?? USER_MESSAGES[code]);
    this.name = 'AppError';
    this.code = code;
    this.userMessage = userMessage ?? USER_MESSAGES[code];
    this.details = options?.details;
    this.status =
      options?.status ??
      ({
        UNAUTHORIZED: 401,
        FORBIDDEN: 403,
        NOT_FOUND: 404,
        VALIDATION: 400,
        CONFLICT: 409,
        RATE_LIMIT: 429,
        INTERNAL: 500,
      }[code] as number);
    if (options?.cause) {
      console.error(`[AppError:${code}]`, options.cause);
    }
  }
}

export function toUserError(err: unknown): { message: string; code?: string } {
  if (err instanceof AppError) {
    return { message: err.userMessage, code: err.code };
  }
  if (err instanceof Error) {
    // Known safe business messages we still allow through
    const safePrefixes = [
      'Insufficient stock',
      'Payment exceeds',
      'An active installment',
      'Branch is required',
      'Invoice already exists',
      'Order already received',
      'Add at least one',
      'Feature not enabled',
      'Database is not connected',
      'Workspace required',
      'Permission denied',
      'Access denied',
      'Customer not found',
      'Part not found',
      'Supplier not found',
      'Vehicle not found',
      'Repair order not found',
      'Invoice not found',
      'Payment not found',
      'Installment',
      'Cannot assign',
      'Cannot archive',
      'Amounts and due dates',
    ];
    if (safePrefixes.some((p) => err.message.startsWith(p) || err.message.includes(p))) {
      return { message: err.message };
    }
    console.error('[unhandled]', err);
    return { message: USER_MESSAGES.INTERNAL, code: 'INTERNAL' };
  }
  console.error('[unknown]', err);
  return { message: USER_MESSAGES.INTERNAL, code: 'INTERNAL' };
}

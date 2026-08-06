'use client';

import { toast } from 'sonner';
import { formError } from '@/lib/form-error';

type MutateOptions = {
  success?: string;
  error?: string;
  /** Called after success (e.g. router.refresh) */
  onSuccess?: () => void | Promise<void>;
  /** Called after failure once toast is shown */
  onError?: (message: string) => void;
};

/**
 * Run a server mutation with toast feedback. Does not catch to allow callers
 * to roll back optimistic state — returns success boolean instead.
 */
export async function runMutation(
  action: () => Promise<unknown>,
  options: MutateOptions = {}
): Promise<boolean> {
  try {
    await action();
    if (options.success) toast.success(options.success);
    await options.onSuccess?.();
    return true;
  } catch (err) {
    const message = options.error || formError(err);
    toast.error(message);
    options.onError?.(message);
    return false;
  }
}

export { toast };

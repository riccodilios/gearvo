import { toUserError } from '@/server/errors';

/** Client-safe error extraction for form dialogs. */
export function formError(err: unknown): string {
  return toUserError(err).message;
}

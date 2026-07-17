import { isAxiosError } from 'axios';

export function getErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const apiMessage = (error.response?.data as { error?: { message?: string } } | undefined)?.error?.message;
    if (apiMessage) return apiMessage;
    if (!error.response) return 'You appear to be offline. Changes will sync automatically when the connection returns.';
    if (error.response.status >= 500) return 'The service is temporarily unavailable. Please try again.';
  }
  return error instanceof Error ? error.message : 'An unexpected error occurred.';
}

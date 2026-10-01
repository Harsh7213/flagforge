export const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (typeof error === 'object' && error !== null && 'status' in error && error.status === 403) {
    return 'Not authorized';
  }
  return fallback;
};
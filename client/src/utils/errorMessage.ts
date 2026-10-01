export const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (typeof error !== 'object' || error === null) {
    return fallback;
  }

  const apiError = error as {
    status?: number;
    data?: {
      error?: string;
      message?: string;
    };
    message?: string;
  };

  if (apiError.status === 403) {
    return 'Not authorized';
  }

  if (typeof apiError.data?.error === 'string' && apiError.data.error.trim()) {
    return apiError.data.error;
  }

  if (typeof apiError.data?.message === 'string' && apiError.data.message.trim()) {
    return apiError.data.message;
  }

  if (typeof apiError.message === 'string' && apiError.message.trim()) {
    return apiError.message;
  }

  return fallback;
};

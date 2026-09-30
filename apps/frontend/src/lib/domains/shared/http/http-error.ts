import axios from 'axios';

export const readHttpErrorStatus = (error: unknown): number | undefined => {
  if (!axios.isAxiosError(error)) {
    return undefined;
  }

  return error.response?.status;
};

export const readHttpErrorMessage = (error: unknown): string | undefined => {
  if (!axios.isAxiosError<{ message?: string | string[] }>(error)) {
    return undefined;
  }

  const message = error.response?.data?.message;

  return Array.isArray(message) ? message.join(', ') : message || undefined;
};

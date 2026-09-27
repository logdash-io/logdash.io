import axios from 'axios';

export const readHttpErrorStatus = (error: unknown): number | undefined => {
  if (!axios.isAxiosError(error)) {
    return undefined;
  }

  return error.response?.status;
};

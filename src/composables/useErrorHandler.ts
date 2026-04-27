import { message } from 'ant-design-vue';

interface ApiError {
  userMessage?: string;
  message?: string;
}

export function useErrorHandler() {
  function handleError(error: unknown, fallbackMessage = 'An error occurred') {
    const apiErr = error as ApiError | null;
    const displayMessage = apiErr?.userMessage || (error instanceof Error ? error.message : null) || fallbackMessage;
    message.error(displayMessage);
  }

  return { handleError };
}

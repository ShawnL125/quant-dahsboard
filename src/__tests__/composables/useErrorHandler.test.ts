import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('ant-design-vue', () => ({
  message: { error: vi.fn() },
}));

import { useErrorHandler } from '@/composables/useErrorHandler';
import { message } from 'ant-design-vue';

describe('useErrorHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows userMessage from API error', () => {
    const { handleError } = useErrorHandler();
    handleError({ userMessage: 'Network error. Please check your connection.' });
    expect(message.error).toHaveBeenCalledWith('Network error. Please check your connection.');
  });

  it('shows Error.message when no userMessage', () => {
    const { handleError } = useErrorHandler();
    handleError(new Error('Something broke'));
    expect(message.error).toHaveBeenCalledWith('Something broke');
  });

  it('shows fallback for unknown error types', () => {
    const { handleError } = useErrorHandler();
    handleError('unknown string');
    expect(message.error).toHaveBeenCalledWith('An error occurred');
  });

  it('shows custom fallback message', () => {
    const { handleError } = useErrorHandler();
    handleError(null, 'Custom fallback');
    expect(message.error).toHaveBeenCalledWith('Custom fallback');
  });

  it('prefers userMessage over Error.message', () => {
    const { handleError } = useErrorHandler();
    const err = new Error('internal message');
    (err as unknown as { userMessage: string }).userMessage = 'User-friendly message';
    handleError(err);
    expect(message.error).toHaveBeenCalledWith('User-friendly message');
  });
});

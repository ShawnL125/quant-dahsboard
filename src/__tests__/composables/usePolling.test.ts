import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { usePolling } from '@/composables/usePolling';

describe('usePolling', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calls fn immediately by default', () => {
    const fn = vi.fn().mockResolvedValue(undefined);
    usePolling({ fn, intervalMs: 1000 });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('does not call fn immediately when immediate is false', () => {
    const fn = vi.fn().mockResolvedValue(undefined);
    usePolling({ fn, intervalMs: 1000, immediate: false });
    expect(fn).not.toHaveBeenCalled();
  });

  it('calls fn at interval', () => {
    const fn = vi.fn().mockResolvedValue(undefined);
    const { start } = usePolling({ fn, intervalMs: 5000, immediate: false });
    start();
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(5000);
    expect(fn).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(5000);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('stop() halts polling', () => {
    const fn = vi.fn().mockResolvedValue(undefined);
    const { start, stop } = usePolling({ fn, intervalMs: 1000, immediate: false });

    start();
    vi.advanceTimersByTime(1000);
    expect(fn).toHaveBeenCalledTimes(1);

    stop();
    vi.advanceTimersByTime(5000);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('start() restarts polling after stop', () => {
    const fn = vi.fn().mockResolvedValue(undefined);
    const { start, stop } = usePolling({ fn, intervalMs: 1000, immediate: false });

    start();
    stop();
    start();

    vi.advanceTimersByTime(1000);
    // immediate is false, so fn should only be called from interval
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('pause() stops polling', () => {
    const fn = vi.fn().mockResolvedValue(undefined);
    const { start, pause } = usePolling({ fn, intervalMs: 1000, immediate: false });

    start();
    pause();
    vi.advanceTimersByTime(5000);
    expect(fn).not.toHaveBeenCalled();
  });

  it('resume() restarts polling after pause', () => {
    const fn = vi.fn().mockResolvedValue(undefined);
    const { resume, pause } = usePolling({ fn, intervalMs: 1000, immediate: false });

    pause();
    resume();

    vi.advanceTimersByTime(1000);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('stops polling when page is hidden', () => {
    const fn = vi.fn().mockResolvedValue(undefined);
    usePolling({ fn, intervalMs: 1000, immediate: false, pauseWhenHidden: true });

    Object.defineProperty(document, 'hidden', { value: true, writable: true, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));

    vi.advanceTimersByTime(5000);
    expect(fn).not.toHaveBeenCalled();

    Object.defineProperty(document, 'hidden', { value: false, writable: true, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));

    vi.advanceTimersByTime(1000);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('does not pause when pauseWhenHidden is false', () => {
    const fn = vi.fn().mockResolvedValue(undefined);
    const { start } = usePolling({ fn, intervalMs: 1000, immediate: false, pauseWhenHidden: false });
    start();

    Object.defineProperty(document, 'hidden', { value: true, writable: true, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));

    vi.advanceTimersByTime(1000);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

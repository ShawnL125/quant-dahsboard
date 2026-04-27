import { onUnmounted } from 'vue';

interface UsePollingOptions {
  fn: () => Promise<void>;
  intervalMs: number;
  pauseWhenHidden?: boolean;
  immediate?: boolean;
}

export function usePolling(options: UsePollingOptions) {
  const {
    fn,
    intervalMs,
    pauseWhenHidden = true,
    immediate = true,
  } = options;

  let timer: ReturnType<typeof setInterval> | null = null;
  let paused = false;

  function start() {
    stop();
    if (immediate) {
      fn();
    }
    timer = setInterval(fn, intervalMs);
  }

  function stop() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  function onVisibilityChange() {
    if (!pauseWhenHidden) return;
    if (document.hidden) {
      stop();
    } else if (!paused) {
      start();
    }
  }

  function pause() {
    paused = true;
    stop();
  }

  function resume() {
    paused = false;
    start();
  }

  if (pauseWhenHidden) {
    document.addEventListener('visibilitychange', onVisibilityChange);
  }

  if (immediate) {
    start();
  }

  onUnmounted(() => {
    stop();
    if (pauseWhenHidden) {
      document.removeEventListener('visibilitychange', onVisibilityChange);
    }
  });

  return { start, stop, pause, resume };
}

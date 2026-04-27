import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref, nextTick } from 'vue';
import WsDisconnectBanner from '@/components/common/WsDisconnectBanner.vue';

vi.mock('ant-design-vue', () => ({
  message: { success: vi.fn(), error: vi.fn() },
}));

import { message } from 'ant-design-vue';

describe('WsDisconnectBanner', () => {
  let wsConnected: ReturnType<typeof ref<boolean>>;
  let wsReconnectAttempt: ReturnType<typeof ref<number>>;

  beforeEach(() => {
    vi.useFakeTimers();
    wsConnected = ref(false);
    wsReconnectAttempt = ref(0);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  function mountBanner() {
    return mount(WsDisconnectBanner, {
      global: {
        provide: {
          wsConnected,
          wsReconnectAttempt,
        },
        stubs: {
          // Stub any Ant Design components if needed
        },
      },
    });
  }

  it('does not show banner when connected', () => {
    wsConnected.value = true;
    const wrapper = mountBanner();
    expect(wrapper.find('.ws-disconnect-banner').exists()).toBe(false);
  });

  it('shows banner after 5 seconds of disconnection', async () => {
    wsConnected.value = true;
    const wrapper = mountBanner();

    wsConnected.value = false;
    await nextTick();

    // Not shown immediately
    expect(wrapper.find('.ws-disconnect-banner').exists()).toBe(false);

    // After 5 seconds
    vi.advanceTimersByTime(5000);
    await nextTick();

    expect(wrapper.find('.ws-disconnect-banner').exists()).toBe(true);
  });

  it('shows reconnect attempt count', async () => {
    wsConnected.value = true;
    const wrapper = mountBanner();

    wsConnected.value = false;
    wsReconnectAttempt.value = 3;
    await nextTick();

    vi.advanceTimersByTime(5000);
    await nextTick();

    expect(wrapper.text()).toContain('attempt 3');
  });

  it('shows success message when reconnected', async () => {
    wsConnected.value = true;
    const wrapper = mountBanner();

    // Disconnect
    wsConnected.value = false;
    wsReconnectAttempt.value = 2;
    await nextTick();

    vi.advanceTimersByTime(5000);
    await nextTick();

    expect(wrapper.find('.ws-disconnect-banner').exists()).toBe(true);

    // Reconnect
    wsConnected.value = true;
    await nextTick();

    expect(wrapper.find('.ws-disconnect-banner').exists()).toBe(false);
    expect(message.success).toHaveBeenCalledWith('Connection restored');
  });

  it('does not show banner if reconnected within 5 seconds', async () => {
    wsConnected.value = true;
    const wrapper = mountBanner();

    wsConnected.value = false;
    await nextTick();

    vi.advanceTimersByTime(3000);

    wsConnected.value = true;
    await nextTick();

    vi.advanceTimersByTime(2000);
    await nextTick();

    expect(wrapper.find('.ws-disconnect-banner').exists()).toBe(false);
  });
});

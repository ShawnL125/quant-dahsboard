import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { SignalEvent } from '@/types';

const MAX_SIGNALS = 500;

export const useSignalsStore = defineStore('signals', () => {
  const signals = ref<SignalEvent[]>([]);
  const latestByStrategy = ref<Record<string, SignalEvent>>({});

  function addSignal(event: SignalEvent) {
    signals.value = [event, ...signals.value].slice(0, MAX_SIGNALS);
    if (event.signal?.strategy_id) {
      latestByStrategy.value = {
        ...latestByStrategy.value,
        [event.signal.strategy_id]: event,
      };
    }
  }

  function clear() {
    signals.value = [];
    latestByStrategy.value = {};
  }

  return { signals, latestByStrategy, addSignal, clear };
});

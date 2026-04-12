import { defineStore } from 'pinia';
import { ref } from 'vue';
import { tradingApi } from '@/api/trading';
import type { PortfolioSnapshot, Position } from '@/types';

export const useTradingStore = defineStore('trading', () => {
  const portfolio = ref<PortfolioSnapshot | null>(null);
  const positions = ref<Position[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchPortfolio() {
    try {
      portfolio.value = await tradingApi.getPortfolio();
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e);
    }
  }

  async function fetchPositions() {
    try {
      positions.value = await tradingApi.getPositions();
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e);
    }
  }

  async function fetchAll() {
    loading.value = true;
    await Promise.all([fetchPortfolio(), fetchPositions()]);
    loading.value = false;
  }

  function updatePortfolioFromWS(data: Record<string, unknown>) {
    if (data?.total_equity) {
      portfolio.value = { ...portfolio.value, ...data } as PortfolioSnapshot;
    }
  }

  function updatePositionsFromWS(data: unknown) {
    if (Array.isArray(data)) {
      positions.value = data as Position[];
      return;
    }
    if (!data || typeof data !== 'object') return;

    // WS events wrap the position in an envelope: { event_type, action, data: {...} }
    const envelope = data as Record<string, unknown>;
    const action = envelope.action as string | undefined;
    const posData = (envelope.data && typeof envelope.data === 'object')
      ? envelope.data as Record<string, unknown>
      : envelope;

    const pos = posData as unknown as Position;
    if (!pos.symbol) return;

    const idx = positions.value.findIndex(
      (p) => p.symbol === pos.symbol && p.exchange === pos.exchange,
    );

    if (action === 'DELETE' && idx >= 0) {
      positions.value = positions.value.filter((_, i) => i !== idx);
    } else if (idx >= 0) {
      positions.value[idx] = { ...positions.value[idx], ...pos };
    } else {
      positions.value = [...positions.value, pos];
    }
  }

  return {
    portfolio,
    positions,
    loading,
    error,
    fetchPortfolio,
    fetchPositions,
    fetchAll,
    updatePortfolioFromWS,
    updatePositionsFromWS,
  };
});

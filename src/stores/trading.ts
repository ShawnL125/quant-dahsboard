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
    } else if (data && typeof data === 'object' && 'symbol' in data) {
      const pos = data as Position;
      const idx = positions.value.findIndex(
        (p) => p.symbol === pos.symbol && p.exchange === pos.exchange,
      );
      if (idx >= 0) {
        positions.value[idx] = { ...positions.value[idx], ...pos };
      } else {
        positions.value = [...positions.value, pos];
      }
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

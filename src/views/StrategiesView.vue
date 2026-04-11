<template>
  <div class="strategies-page">
    <div class="action-bar">
      <div class="action-left">
        <span class="active-count">{{ activeCount }} Active</span>
        <span class="total-count">/ {{ store.strategies.length }} Total</span>
      </div>
      <a-button type="primary" :loading="store.loading" @click="onReload">
        Reload
      </a-button>
    </div>

    <a-alert
      v-if="store.error"
      :message="store.error"
      type="error"
      show-icon
      class="page-section"
    />

    <StrategyList
      :strategies="store.strategies"
      @toggle="onToggle"
      @view="onView"
      class="page-section"
    />

    <StrategyDetail
      :strategy="store.selectedStrategy"
      :open="detailOpen"
      @close="detailOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useStrategiesStore } from '@/stores/strategies';
import StrategyList from '@/components/strategies/StrategyList.vue';
import StrategyDetail from '@/components/strategies/StrategyDetail.vue';
import { message } from 'ant-design-vue';

const store = useStrategiesStore();
const detailOpen = ref(false);

const activeCount = computed(() => store.strategies.filter((s) => s.is_running).length);

async function onToggle(id: string, enabled: boolean) {
  await store.toggleStrategy(id, enabled);
  message.success(`Strategy ${enabled ? 'enabled' : 'disabled'}`);
}

async function onView(id: string) {
  await store.selectStrategy(id);
  detailOpen.value = true;
}

async function onReload() {
  await store.reloadStrategies();
  message.success('Strategies reloaded');
}

onMounted(() => {
  store.fetchStrategies();
});
</script>

<style scoped>
.strategies-page {
  display: flex;
  flex-direction: column;
  gap: var(--q-card-gap);
}

.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.action-left {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.active-count {
  font-size: 16px;
  font-weight: 700;
  color: var(--q-text);
}

.total-count {
  font-size: 13px;
  color: var(--q-text-muted);
}

.page-section { margin-top: 0; }
</style>

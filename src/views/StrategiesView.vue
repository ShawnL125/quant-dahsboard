<template>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px">
      <a-spin :spinning="store.loading" />
      <a-button type="primary" @click="onReload">
        Reload Strategies
      </a-button>
    </div>

    <a-alert
      v-if="store.error"
      :message="store.error"
      type="error"
      show-icon
      style="margin-bottom: 16px"
    />

    <StrategyList
      :strategies="store.strategies"
      @toggle="onToggle"
      @view="onView"
    />

    <StrategyDetail
      :strategy="store.selectedStrategy"
      :open="detailOpen"
      @close="detailOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useStrategiesStore } from '@/stores/strategies';
import StrategyList from '@/components/strategies/StrategyList.vue';
import StrategyDetail from '@/components/strategies/StrategyDetail.vue';
import { message } from 'ant-design-vue';

const store = useStrategiesStore();
const detailOpen = ref(false);

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

<template>
  <div class="features-page">
    <a-spin :spinning="store.loading">
      <!-- Status Card -->
      <div class="status-card">
        <div class="section-header">
          <span class="section-title">Feature Store Status</span>
          <a-button size="small" @click="store.fetchStatus()">Refresh</a-button>
        </div>
        <div v-if="store.status" class="status-grid">
          <div v-for="(value, key) in store.status" :key="String(key)" class="status-item">
            <span class="status-label">{{ key }}</span>
            <span class="status-value">{{ value }}</span>
          </div>
        </div>
        <div v-else class="empty-state">No status available</div>
      </div>

      <a-alert v-if="store.error" :message="store.error" type="error" show-icon class="page-section" />

      <!-- Definitions -->
      <DefinitionTable class="page-section" />

      <!-- Values -->
      <FeatureValueTable class="page-section" />

      <!-- Precompute Modal -->
      <a-modal
        v-model:open="precomputeModalOpen"
        title="Precompute Features"
        @ok="onPrecompute"
        :confirm-loading="precomputing"
      >
        <a-form layout="vertical">
          <a-form-item label="Symbol" required>
            <a-input v-model:value="precomputeForm.symbol" placeholder="e.g., BTC/USDT" />
          </a-form-item>
          <a-form-item label="Timeframe" required>
            <a-input v-model:value="precomputeForm.timeframe" placeholder="e.g., 1h" />
          </a-form-item>
        </a-form>
      </a-modal>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useFeaturesStore } from '@/stores/features';
import { message } from 'ant-design-vue';
import DefinitionTable from '@/components/features/DefinitionTable.vue';
import FeatureValueTable from '@/components/features/FeatureValueTable.vue';

const store = useFeaturesStore();

const precomputeModalOpen = ref(false);
const precomputing = ref(false);
const precomputeForm = reactive({ symbol: '', timeframe: '' });

async function onPrecompute() {
  if (!precomputeForm.symbol || !precomputeForm.timeframe) {
    message.warning('Symbol and timeframe are required');
    return;
  }
  precomputing.value = true;
  try {
    await store.precompute({
      symbol: precomputeForm.symbol,
      timeframe: precomputeForm.timeframe,
    });
    message.success('Precompute completed');
    precomputeModalOpen.value = false;
    precomputeForm.symbol = '';
    precomputeForm.timeframe = '';
    store.fetchValues();
  } catch {
    message.error('Precompute failed');
  } finally {
    precomputing.value = false;
  }
}

onMounted(() => {
  store.fetchStatus();
  store.fetchDefinitions();
  store.fetchValues();
});
</script>

<style scoped>
.features-page {
  display: flex;
  flex-direction: column;
  gap: var(--q-card-gap);
}

.page-section { margin-top: var(--q-card-gap); }

.status-card {
  background: var(--q-card);
  border-radius: var(--q-card-radius);
  padding: var(--q-card-padding);
  box-shadow: var(--q-card-shadow);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--q-primary-dark);
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 10px;
}

.status-item {
  background: var(--q-bg);
  border: 1px solid var(--q-border);
  border-radius: 8px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.status-label {
  font-size: 11px;
  color: var(--q-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.status-value {
  font-size: 13px;
  font-weight: 600;
  color: var(--q-text);
}

.empty-state {
  text-align: center;
  color: var(--q-text-muted);
  padding: 24px 0;
  font-size: 13px;
}
</style>

<template>
  <div class="run-form-card">
    <div class="card-title">Run Replay</div>
    <a-form layout="inline" :model="form" @finish="handleSubmit">
      <a-form-item label="Strategy ID" name="strategy_id" :rules="[{ required: true, message: 'Required' }]">
        <a-input v-model:value="form.strategy_id" placeholder="strategy-1" style="width: 160px" />
      </a-form-item>
      <a-form-item label="Symbol" name="symbol" :rules="[{ required: true, message: 'Required' }]">
        <a-input v-model:value="form.symbol" placeholder="BTC/USDT" style="width: 140px" />
      </a-form-item>
      <a-form-item label="Start Time" name="start_time">
        <a-input v-model:value="form.start_time" placeholder="2024-01-01T00:00:00Z" style="width: 200px" />
      </a-form-item>
      <a-form-item label="End Time" name="end_time">
        <a-input v-model:value="form.end_time" placeholder="2024-12-31T23:59:59Z" style="width: 200px" />
      </a-form-item>
      <a-form-item>
        <a-button type="primary" html-type="submit" :loading="loading">
          Run
        </a-button>
      </a-form-item>
    </a-form>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue';

const props = defineProps<{
  loading: boolean;
}>();

const emit = defineEmits<{
  run: [data: { strategy_id: string; symbol: string; start_time?: string; end_time?: string }];
}>();

const form = reactive({
  strategy_id: '',
  symbol: '',
  start_time: '',
  end_time: '',
});

function handleSubmit() {
  const data: { strategy_id: string; symbol: string; start_time?: string; end_time?: string } = {
    strategy_id: form.strategy_id,
    symbol: form.symbol,
  };
  if (form.start_time) {
    data.start_time = form.start_time;
  }
  if (form.end_time) {
    data.end_time = form.end_time;
  }
  emit('run', data);
}
</script>

<style scoped>
.run-form-card {
  background: var(--q-card);
  border-radius: var(--q-card-radius);
  padding: var(--q-card-padding);
  box-shadow: var(--q-card-shadow);
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--q-primary-dark);
  margin-bottom: 16px;
}
</style>

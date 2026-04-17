<template>
  <div class="autotune-page">
    <a-spin :spinning="store.loading">
      <div class="runs-section">
        <div class="section-header">
          <span class="section-title">Auto-Tune Runs</span>
          <a-button size="small" type="primary" @click="showTrigger = true">Trigger Run</a-button>
        </div>
        <table v-if="store.runs.length > 0" class="data-table">
          <thead>
            <tr>
              <th>Run ID</th>
              <th>Strategy</th>
              <th>Mode</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="run in store.runs" :key="run.run_id">
              <td class="text-mono">{{ run.run_id.slice(0, 8) }}</td>
              <td class="text-bold">{{ run.strategy_id }}</td>
              <td><span class="mode-pill">{{ run.apply_mode }}</span></td>
              <td><span class="status-pill" :class="'status-' + run.status">{{ run.status }}</span></td>
              <td class="text-muted">{{ formatTime(run.created_at) }}</td>
              <td class="action-cell">
                <a-button v-if="run.status === 'pending'" size="small" @click="store.confirmRun(run.run_id)">Confirm</a-button>
                <a-button v-if="run.status === 'applied'" size="small" danger @click="store.rollbackRun(run.run_id)">Rollback</a-button>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty-state">No auto-tune runs</div>
      </div>

      <div class="schedules-section page-section">
        <div class="section-header">
          <span class="section-title">Scheduled Auto-Tune</span>
          <span v-if="store.schedules.length > 0" class="section-badge">{{ store.schedules.length }}</span>
        </div>
        <table v-if="store.schedules.length > 0" class="data-table">
          <thead>
            <tr>
              <th>Schedule ID</th>
              <th>Strategy</th>
              <th>Cron</th>
              <th>Mode</th>
              <th>Train/Test</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="sched in store.schedules" :key="sched.schedule_id">
              <td class="text-mono">{{ sched.schedule_id.slice(0, 8) }}</td>
              <td class="text-bold">{{ sched.strategy_id }}</td>
              <td class="text-mono">{{ sched.cron_expr }}</td>
              <td><span class="mode-pill">{{ sched.apply_mode }}</span></td>
              <td>{{ sched.train_days }}d / {{ sched.test_days }}d</td>
              <td><a-button size="small" danger @click="store.deleteSchedule(sched.schedule_id)">Delete</a-button></td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty-state">No scheduled auto-tune jobs</div>
      </div>
    </a-spin>

    <a-modal v-model:open="showTrigger" title="Trigger Auto-Tune Run" @ok="onTrigger" :confirm-loading="triggering">
      <a-form layout="vertical">
        <a-form-item label="Strategy ID">
          <a-input v-model:value="triggerForm.strategy_id" placeholder="my_strategy" />
        </a-form-item>
        <a-form-item label="Apply Mode">
          <a-select v-model:value="triggerForm.apply_mode">
            <a-select-option value="manual">Manual (review before apply)</a-select-option>
            <a-select-option value="auto">Auto (apply immediately)</a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAutoTuneStore } from '@/stores/auto_tune';

const store = useAutoTuneStore();
const showTrigger = ref(false);
const triggering = ref(false);
const triggerForm = ref({ strategy_id: '', apply_mode: 'manual' });

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
}

async function onTrigger() {
  if (!triggerForm.value.strategy_id) return;
  triggering.value = true;
  try {
    await store.triggerRun(triggerForm.value);
    showTrigger.value = false;
    triggerForm.value = { strategy_id: '', apply_mode: 'manual' };
  } finally {
    triggering.value = false;
  }
}

onMounted(() => { store.fetchAll(); });
</script>

<style scoped>
.autotune-page { display: flex; flex-direction: column; gap: var(--q-card-gap); }
.page-section { margin-top: var(--q-card-gap); }

.runs-section,
.schedules-section {
  background: var(--q-card);
  border-radius: var(--q-card-radius);
  padding: var(--q-card-padding);
  box-shadow: var(--q-card-shadow);
}

.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.section-title { font-size: 13px; font-weight: 600; color: var(--q-primary-dark); }
.section-badge { background: var(--q-primary-light); color: var(--q-primary); font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 10px; }

.data-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.data-table th { text-align: left; color: var(--q-text-muted); font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.02em; padding: 6px 0; }
.data-table td { padding: 8px 0; color: var(--q-text); border-bottom: 1px solid var(--q-border); }
.data-table tbody tr:last-child td { border-bottom: none; }
.data-table tbody tr:hover td { background: var(--q-hover); }

.text-bold { font-weight: 600; }
.text-muted { color: var(--q-text-muted); font-size: 11px; }
.text-mono { font-family: 'SF Mono', 'Fira Code', monospace; font-size: 11px; }

.mode-pill { display: inline-block; padding: 1px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; background: rgba(59, 130, 246, 0.12); color: #3b82f6; }
.status-pill { display: inline-block; padding: 1px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; }
.status-completed, .status-applied { background: rgba(34, 197, 94, 0.12); color: #22c55e; }
.status-running { background: rgba(59, 130, 246, 0.12); color: #3b82f6; }
.status-pending { background: rgba(234, 179, 8, 0.12); color: #eab308; }
.status-failed { background: rgba(239, 68, 68, 0.12); color: #ef4444; }
.status-rolled_back { background: rgba(156, 163, 175, 0.12); color: #9ca3af; }

.action-cell { display: flex; gap: 6px; }
.empty-state { text-align: center; color: var(--q-text-muted); padding: 24px 0; font-size: 13px; }
</style>

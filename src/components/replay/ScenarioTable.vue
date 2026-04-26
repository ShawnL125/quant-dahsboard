<template>
  <div class="scenarios-card">
    <table v-if="scenarios.length > 0" class="data-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Symbol</th>
          <th>Start</th>
          <th>End</th>
          <th>Created</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="scenario in scenarios" :key="scenario.scenario_id">
          <td class="text-bold">{{ scenario.name }}</td>
          <td>{{ scenario.symbol }}</td>
          <td class="text-muted">{{ formatTime(scenario.start_time) }}</td>
          <td class="text-muted">{{ formatTime(scenario.end_time) }}</td>
          <td class="text-muted">{{ formatTime(scenario.created_at) }}</td>
          <td class="actions-cell">
            <span class="view-link" @click="emit('loadSteps', scenario.scenario_id)">Load Steps</span>
            <a-popconfirm
              title="Delete this scenario?"
              ok-text="Delete"
              cancel-text="Cancel"
              @confirm="emit('delete', scenario.scenario_id)"
            >
              <span class="delete-link">Delete</span>
            </a-popconfirm>
          </td>
        </tr>
      </tbody>
    </table>
    <div v-else class="empty-state">No scenarios found</div>
  </div>
</template>

<script setup lang="ts">
import type { ReplayScenario } from '@/types';

defineProps<{
  scenarios: ReplayScenario[];
}>();

const emit = defineEmits<{
  loadSteps: [scenarioId: string];
  delete: [scenarioId: string];
}>();

function formatTime(dateStr?: string): string {
  if (!dateStr) return '-';
  try { return new Date(dateStr).toLocaleString(); }
  catch { return dateStr; }
}
</script>

<style scoped>
.scenarios-card {
  background: var(--q-card);
  border-radius: var(--q-card-radius);
  padding: var(--q-card-padding);
  box-shadow: var(--q-card-shadow);
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.data-table th {
  text-align: left;
  color: var(--q-text-muted);
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  padding: 6px 0;
}

.data-table td {
  padding: 10px 0;
  color: var(--q-text);
  border-bottom: 1px solid var(--q-border);
}

.data-table tbody tr:last-child td { border-bottom: none; }
.data-table tbody tr:hover td { background: var(--q-hover); }

.actions-cell {
  display: flex;
  gap: 12px;
  align-items: center;
}

.view-link {
  font-size: 12px;
  color: var(--q-primary);
  cursor: pointer;
  font-weight: 500;
}

.view-link:hover { text-decoration: underline; }

.delete-link {
  font-size: 12px;
  color: var(--q-error);
  cursor: pointer;
  font-weight: 500;
}

.delete-link:hover { text-decoration: underline; }

.text-muted { color: var(--q-text-muted); }
.text-bold { font-weight: 600; }

.empty-state {
  text-align: center;
  color: var(--q-text-muted);
  padding: 24px 0;
  font-size: 13px;
}
</style>

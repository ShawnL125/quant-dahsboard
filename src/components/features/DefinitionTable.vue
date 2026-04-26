<template>
  <div class="definitions-card">
    <div class="section-header">
      <div class="section-title-group">
        <span class="section-title">Definitions</span>
        <span v-if="store.definitions.length > 0" class="card-badge">{{ store.definitions.length }}</span>
      </div>
      <a-button size="small" type="primary" @click="registerModalOpen = true">Register</a-button>
    </div>

    <table v-if="store.definitions.length > 0" class="data-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Type</th>
          <th>Source</th>
          <th>Min Periods</th>
          <th>Output Keys</th>
          <th>Description</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="defn in store.definitions" :key="defn.name">
          <td class="text-bold text-mono">{{ defn.name }}</td>
          <td class="text-muted">{{ defn.feature_type || '-' }}</td>
          <td class="text-muted">{{ defn.source || '-' }}</td>
          <td class="text-mono">{{ defn.min_periods }}</td>
          <td>
            <span v-if="defn.output_keys && defn.output_keys.length > 0">
              <a-tag v-for="key in defn.output_keys" :key="key" class="output-tag">{{ key }}</a-tag>
            </span>
            <span v-else class="text-muted">-</span>
          </td>
          <td class="text-muted desc-cell">{{ defn.description || '-' }}</td>
          <td>
            <a-popconfirm
              title="Delete this definition?"
              @confirm="onDelete(defn.name)"
              ok-text="Yes"
              cancel-text="No"
            >
              <span class="delete-link">Delete</span>
            </a-popconfirm>
          </td>
        </tr>
      </tbody>
    </table>
    <div v-else class="empty-state">No feature definitions registered</div>

    <!-- Register Modal -->
    <a-modal
      v-model:open="registerModalOpen"
      title="Register Feature Definition"
      @ok="onRegister"
      :confirm-loading="registering"
    >
      <a-form layout="vertical">
        <a-form-item label="Name" required>
          <a-input v-model:value="registerForm.name" placeholder="e.g., sma_20" />
        </a-form-item>
        <a-form-item label="Type">
          <a-input v-model:value="registerForm.feature_type" placeholder="e.g., indicator" />
        </a-form-item>
        <a-form-item label="Source">
          <a-input v-model:value="registerForm.source" placeholder="e.g., talib" />
        </a-form-item>
        <a-form-item label="Min Periods">
          <a-input-number v-model:value="registerForm.min_periods" :min="1" style="width: 100%" />
        </a-form-item>
        <a-form-item label="Description">
          <a-textarea v-model:value="registerForm.description" :rows="2" placeholder="Feature description..." />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useFeaturesStore } from '@/stores/features';
import { message } from 'ant-design-vue';

const store = useFeaturesStore();

const registerModalOpen = ref(false);
const registering = ref(false);
const registerForm = reactive({
  name: '',
  feature_type: '',
  source: '',
  min_periods: 1,
  description: '',
});

async function onDelete(name: string) {
  try {
    await store.deleteDefinition(name);
    message.success(`Definition "${name}" deleted`);
  } catch {
    message.error(`Failed to delete "${name}"`);
  }
}

async function onRegister() {
  if (!registerForm.name) {
    message.warning('Name is required');
    return;
  }
  registering.value = true;
  try {
    await store.registerDefinition({
      name: registerForm.name,
      feature_type: registerForm.feature_type || undefined,
      source: registerForm.source || undefined,
      min_periods: registerForm.min_periods,
      description: registerForm.description || undefined,
    });
    message.success(`Definition "${registerForm.name}" registered`);
    registerModalOpen.value = false;
    registerForm.name = '';
    registerForm.feature_type = '';
    registerForm.source = '';
    registerForm.min_periods = 1;
    registerForm.description = '';
  } catch {
    message.error('Failed to register definition');
  } finally {
    registering.value = false;
  }
}
</script>

<style scoped>
.definitions-card {
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

.section-title-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--q-primary-dark);
}

.card-badge {
  background: var(--q-primary-light);
  color: var(--q-primary);
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
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

.text-muted { color: var(--q-text-muted); }
.text-bold { font-weight: 600; }
.text-mono { font-family: 'SF Mono', 'Fira Code', monospace; font-size: 11px; }

.desc-cell {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.output-tag {
  font-size: 10px;
  padding: 0 6px;
  margin-right: 4px;
  background: var(--q-primary-light);
  color: var(--q-primary);
  border: none;
}

.delete-link {
  font-size: 12px;
  color: var(--q-error);
  cursor: pointer;
  font-weight: 500;
}

.delete-link:hover { text-decoration: underline; }

.empty-state {
  text-align: center;
  color: var(--q-text-muted);
  padding: 24px 0;
  font-size: 13px;
}
</style>

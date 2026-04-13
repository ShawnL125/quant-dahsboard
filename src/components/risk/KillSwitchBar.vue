<template>
  <div class="killswitch-bar" :class="{ active: isActive }">
    <div class="ks-main">
      <div class="ks-left">
        <span class="ks-indicator" :class="{ on: isActive }"></span>
        <span class="ks-label">
          {{ isActive ? 'GLOBAL KILL SWITCH ACTIVE' : 'Kill Switch Inactive' }}
        </span>
        <span v-if="isActive && reason" class="ks-reason">{{ reason }}</span>
      </div>
      <div class="ks-right">
        <a-popconfirm
          v-if="isActive"
          title="Confirm deactivation? Trading will resume."
          ok-text="Deactivate"
          cancel-text="Cancel"
          @confirm="onToggle(false)"
        >
          <a-button danger>DEACTIVATE</a-button>
        </a-popconfirm>
        <a-popconfirm
          v-else
          title="Confirm global KillSwitch? All trading will halt."
          ok-text="Activate"
          cancel-text="Cancel"
          @confirm="onToggle(true)"
        >
          <a-button class="btn-activate">ACTIVATE GLOBAL</a-button>
        </a-popconfirm>
      </div>
    </div>
    <div v-if="symbolKills.length || strategyKills.length" class="ks-details">
      <div v-for="(r, symbol) in killSwitch.symbols" :key="'s-' + symbol" class="ks-detail-row">
        <a-tag color="orange">Symbol: {{ symbol }}</a-tag>
        <span class="ks-detail-reason">{{ r }}</span>
      </div>
      <div v-for="(r, strategy) in killSwitch.strategies" :key="'st-' + strategy" class="ks-detail-row">
        <a-tag color="orange">Strategy: {{ strategy }}</a-tag>
        <span class="ks-detail-reason">{{ r }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { KillSwitchState } from '@/types';

const props = defineProps<{
  killSwitch: KillSwitchState;
}>();

const emit = defineEmits<{
  toggle: [activate: boolean];
}>();

const isActive = computed(() => props.killSwitch?.global?.active ?? false);
const reason = computed(() => props.killSwitch?.global?.reason ?? '');
const symbolKills = computed(() => Object.entries(props.killSwitch?.symbols ?? {}));
const strategyKills = computed(() => Object.entries(props.killSwitch?.strategies ?? {}));

function onToggle(activate: boolean) {
  emit('toggle', activate);
}
</script>

<style scoped>
.killswitch-bar {
  background: #f8fafc;
  border: 1px solid var(--q-border);
  border-radius: var(--q-card-radius);
  padding: 14px 20px;
  margin-bottom: var(--q-card-gap);
}

.killswitch-bar.active {
  background: rgba(239, 68, 68, 0.08);
  border-color: var(--q-error);
  animation: pulse-bg 2s ease-in-out infinite;
}

@keyframes pulse-bg {
  0%, 100% { background: rgba(239, 68, 68, 0.08); }
  50% { background: rgba(239, 68, 68, 0.16); }
}

.ks-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.ks-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.ks-indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--q-text-muted);
  flex-shrink: 0;
}

.ks-indicator.on {
  background: var(--q-error);
  box-shadow: 0 0 8px rgba(239, 68, 68, 0.5);
}

.ks-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--q-text);
}

.killswitch-bar.active .ks-label {
  color: var(--q-error);
}

.ks-reason {
  font-size: 12px;
  color: var(--q-text-secondary);
}

.btn-activate {
  border-color: var(--q-error) !important;
  color: var(--q-error) !important;
}

.btn-activate:hover {
  background: var(--q-error) !important;
  color: #fff !important;
}

.ks-details {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ks-detail-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ks-detail-reason {
  font-size: 12px;
  color: var(--q-text-secondary);
}
</style>

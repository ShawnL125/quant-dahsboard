<template>
  <a-card>
    <a-space :size="24">
      <div>
        <span style="color: rgba(0,0,0,0.45); margin-right: 8px;">Exchanges:</span>
        <a-tag v-for="ex in exchanges" :key="ex" color="blue">{{ ex }}</a-tag>
        <span v-if="exchanges.length === 0">None</span>
      </div>
      <div>
        <span style="color: rgba(0,0,0,0.45); margin-right: 8px;">Strategies:</span>
        <a-badge
          :count="runningStrategies"
          :number-style="{ backgroundColor: '#52c41a' }"
          :overflow-count="99"
        />
        <span style="margin-left: 4px;">/ {{ totalStrategies }} running</span>
      </div>
      <div>
        <span style="color: rgba(0,0,0,0.45); margin-right: 8px;">Uptime:</span>
        <span>{{ formatUptime(uptime) }}</span>
      </div>
    </a-space>
  </a-card>
</template>

<script setup lang="ts">
defineProps<{
  exchanges: string[];
  runningStrategies: number;
  totalStrategies: number;
  uptime: number;
}>();

function formatUptime(seconds: number): string {
  if (!seconds || seconds <= 0) return '-';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const parts: string[] = [];
  if (hrs > 0) parts.push(`${hrs}h`);
  if (mins > 0) parts.push(`${mins}m`);
  parts.push(`${secs}s`);
  return parts.join(' ');
}
</script>

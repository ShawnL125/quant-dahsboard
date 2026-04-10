<template>
  <a-row :gutter="16">
    <a-col :span="8">
      <a-card title="Liveness">
        <a-badge
          :status="liveness?.status === 'ok' || liveness?.status === 'healthy' ? 'success' : 'error'"
          :text="liveness?.status || 'Unknown'"
        />
      </a-card>
    </a-col>
    <a-col :span="8">
      <a-card title="Readiness">
        <a-badge
          :status="readiness?.status === 'ok' || readiness?.status === 'ready' ? 'success' : 'error'"
          :text="readiness?.status || 'Unknown'"
        />
      </a-card>
    </a-col>
    <a-col :span="8">
      <a-card title="Uptime">
        <a-statistic
          :value="uptimeSeconds"
          suffix="seconds"
        />
      </a-card>
    </a-col>
  </a-row>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { HealthStatus } from '@/types';

const props = defineProps<{
  liveness: HealthStatus | null;
  readiness: HealthStatus | null;
}>();

const uptimeSeconds = computed(() => props.liveness?.uptime_seconds ?? 0);
</script>

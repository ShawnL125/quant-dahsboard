<template>
  <div class="report-grid">
    <div class="report-card">
      <span class="report-label">Total Entries</span>
      <span class="report-value">{{ report?.total_entries ?? 0 }}</span>
    </div>
    <div class="report-card">
      <span class="report-label">Reviewed</span>
      <span class="report-value">{{ report?.reviewed_count ?? 0 }}</span>
    </div>
    <div class="report-card">
      <span class="report-label">Pending</span>
      <span class="report-value" :class="{ 'val-negative': pendingCount > 0 }">{{ pendingCount }}</span>
    </div>
    <div class="report-card">
      <span class="report-label">Avg Rating</span>
      <span class="report-value">{{ avgRating }}</span>
    </div>
    <div class="report-card">
      <span class="report-label">Top Tags</span>
      <div class="report-tags">
        <span v-for="tag in topTags" :key="tag" class="report-tag">{{ tag }}</span>
        <span v-if="topTags.length === 0" class="text-muted">-</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { JournalReport } from '@/types';

const props = defineProps<{
  report: JournalReport | null;
  pendingCount: number;
}>();

const avgRating = computed(() => {
  if (!props.report?.avg_rating) return '-';
  const val = parseFloat(props.report.avg_rating);
  return isNaN(val) ? '-' : val.toFixed(1);
});

const topTags = computed(() => props.report?.top_tags?.slice(0, 5) ?? []);
</script>

<style scoped>
.report-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: var(--q-card-gap);
}

.report-card {
  background: var(--q-card);
  border-radius: var(--q-card-radius);
  padding: var(--q-card-padding);
  box-shadow: var(--q-card-shadow);
}

.report-label {
  display: block;
  font-size: 12px;
  color: var(--q-text-muted);
  margin-bottom: 6px;
}

.report-value {
  display: block;
  font-size: 20px;
  font-weight: 700;
  color: var(--q-primary-dark);
}

.report-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
}

.report-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: var(--q-tag-radius);
  font-size: 11px;
  font-weight: 500;
  background: var(--q-primary-light);
  color: var(--q-primary);
}

.val-negative {
  color: var(--q-error);
}

.text-muted {
  color: var(--q-text-muted);
  font-size: 13px;
}

@media (max-width: 900px) {
  .report-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 600px) {
  .report-grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>

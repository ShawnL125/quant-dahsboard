<template>
  <div class="skeleton" :class="`skeleton-${variant}`">
    <!-- Stats: 4-column stat cards -->
    <template v-if="variant === 'stats'">
      <div v-for="i in columns" :key="i" class="skel-card">
        <div class="skel-line skel-label" />
        <div class="skel-line skel-value" />
      </div>
    </template>

    <!-- Table: header row + body rows -->
    <template v-else-if="variant === 'table'">
      <div class="skel-table-header">
        <div v-for="i in columns" :key="i" class="skel-line skel-th" />
      </div>
      <div v-for="r in rows" :key="r" class="skel-table-row">
        <div v-for="c in columns" :key="c" class="skel-line skel-td" />
      </div>
    </template>

    <!-- Card Grid: grid of cards -->
    <template v-else-if="variant === 'card-grid'">
      <div v-for="i in rows * columns" :key="i" class="skel-card">
        <div class="skel-line skel-title" />
        <div class="skel-line skel-body" />
        <div class="skel-line skel-body short" />
      </div>
    </template>

    <!-- Detail: stacked rows -->
    <template v-else-if="variant === 'detail'">
      <div v-for="i in rows" :key="i" class="skel-detail-row">
        <div class="skel-line skel-label" />
        <div class="skel-line skel-value" />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  variant: 'table' | 'card-grid' | 'stats' | 'detail';
  rows?: number;
  columns?: number;
}>(), {
  rows: 4,
  columns: 4,
});
</script>

<style scoped>
.skeleton {
  animation: skeleton-shimmer 1.5s ease-in-out infinite;
  background: none;
}

@keyframes skeleton-shimmer {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

.skel-line {
  background: linear-gradient(90deg, var(--q-card) 25%, var(--q-hover) 50%, var(--q-card) 75%);
  background-size: 200% 100%;
  animation: skeleton-slide 1.5s ease-in-out infinite;
  border-radius: 4px;
}

@keyframes skeleton-slide {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Stats variant */
.skeleton-stats {
  display: grid;
  grid-template-columns: repeat(v-bind(columns), 1fr);
  gap: var(--q-card-gap);
}

.skel-card {
  background: var(--q-card);
  border-radius: var(--q-card-radius);
  padding: 16px;
  box-shadow: var(--q-card-shadow);
}

.skel-label {
  height: 10px;
  width: 60%;
  margin-bottom: 8px;
}

.skel-value {
  height: 20px;
  width: 80%;
}

/* Table variant */
.skeleton-table {
  background: var(--q-card);
  border-radius: var(--q-card-radius);
  padding: var(--q-card-padding);
  box-shadow: var(--q-card-shadow);
}

.skel-table-header {
  display: grid;
  grid-template-columns: repeat(v-bind(columns), 1fr);
  gap: 8px;
  padding-bottom: 8px;
  margin-bottom: 8px;
  border-bottom: 1px solid var(--q-border);
}

.skel-table-row {
  display: grid;
  grid-template-columns: repeat(v-bind(columns), 1fr);
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid var(--q-border);
}

.skel-table-row:last-child {
  border-bottom: none;
}

.skel-th {
  height: 10px;
  width: 70%;
}

.skel-td {
  height: 12px;
  width: 80%;
}

/* Card Grid variant */
.skeleton-card-grid {
  display: grid;
  grid-template-columns: repeat(v-bind(columns), 1fr);
  gap: var(--q-card-gap);
}

.skel-title {
  height: 12px;
  width: 50%;
  margin-bottom: 10px;
}

.skel-body {
  height: 10px;
  width: 90%;
  margin-bottom: 6px;
}

.skel-body.short {
  width: 60%;
}

/* Detail variant */
.skeleton-detail {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skel-detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid var(--q-border);
}

.skel-detail-row:last-child {
  border-bottom: none;
}
</style>

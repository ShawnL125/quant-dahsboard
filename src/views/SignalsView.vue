<template>
  <div class="signals-page">
    <div class="signals-layout">
      <div class="signals-main">
        <div class="feed-card">
          <SignalFeed :signals="store.signals" />
        </div>
      </div>
      <div class="signals-side">
        <div class="summary-card">
          <SignalSummary :latest-by-strategy="store.latestByStrategy" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSignalsStore } from '@/stores/signals';
import SignalFeed from '@/components/signals/SignalFeed.vue';
import SignalSummary from '@/components/signals/SignalSummary.vue';

const store = useSignalsStore();
</script>

<style scoped>
.signals-page {
  display: flex;
  flex-direction: column;
  gap: var(--q-card-gap);
}

.signals-layout {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: var(--q-card-gap);
}

.feed-card {
  background: var(--q-card);
  border-radius: var(--q-card-radius);
  padding: var(--q-card-padding);
  box-shadow: var(--q-card-shadow);
}

.summary-card {
  background: var(--q-card);
  border-radius: var(--q-card-radius);
  padding: var(--q-card-padding);
  box-shadow: var(--q-card-shadow);
}

@media (max-width: 900px) {
  .signals-layout {
    grid-template-columns: 1fr;
  }
}
</style>

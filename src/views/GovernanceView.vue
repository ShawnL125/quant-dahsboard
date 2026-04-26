<template>
  <div class="governance-page">
    <a-tabs v-model:activeKey="activeTab" class="governance-tabs">
      <a-tab-pane key="quality" tab="Quality Scores">
        <QualityScoreTable />
      </a-tab-pane>
      <a-tab-pane key="archive" tab="Data Archive">
        <ArchiveSection />
      </a-tab-pane>
      <a-tab-pane key="lifecycle" tab="Lifecycle">
        <LifecycleSection />
      </a-tab-pane>
    </a-tabs>

    <a-alert
      v-if="store.error"
      :message="store.error"
      type="error"
      show-icon
      class="page-section"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useGovernanceStore } from '@/stores/governance';
import QualityScoreTable from '@/components/governance/QualityScoreTable.vue';
import ArchiveSection from '@/components/governance/ArchiveSection.vue';
import LifecycleSection from '@/components/governance/LifecycleSection.vue';

const store = useGovernanceStore();
const activeTab = ref('quality');
const loadedTabs = new Set<string>(['quality']);

// Lazy-load tab data on first visit
watch(activeTab, (tab) => {
  if (loadedTabs.has(tab)) return;
  loadedTabs.add(tab);

  if (tab === 'archive') {
    store.fetchArchiveStatus();
    store.fetchArchiveRuns();
  } else if (tab === 'lifecycle') {
    store.fetchStatus();
  }
});

onMounted(() => {
  store.fetchQualityScores();
  store.fetchSymbols();
  store.fetchStatus();
});
</script>

<style scoped>
.governance-page {
  display: flex;
  flex-direction: column;
  gap: var(--q-card-gap);
}

.governance-tabs :deep(.ant-tabs-nav) {
  margin-bottom: 0;
}

.page-section {
  margin-top: var(--q-card-gap);
}
</style>

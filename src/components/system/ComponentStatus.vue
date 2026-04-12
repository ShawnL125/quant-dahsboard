<template>
  <div class="component-card">
    <div class="card-title">Components</div>
    <div class="component-list">
      <div class="component-item">
        <div class="comp-info">
          <span class="comp-name">Exchanges</span>
          <span class="comp-desc">Connected trading venues</span>
        </div>
        <div class="comp-tags">
          <span v-for="ex in exchanges" :key="ex" class="tag-blue">{{ ex }}</span>
          <span v-if="exchanges.length === 0" class="text-muted">None</span>
        </div>
      </div>
      <div class="component-divider"></div>
      <div class="component-item">
        <div class="comp-info">
          <span class="comp-name">Subscriptions</span>
          <span class="comp-desc">Market data feeds</span>
        </div>
        <div class="comp-tags">
          <template v-if="Object.keys(subscriptions).length > 0">
            <div v-for="(symbols, exchange) in subscriptions" :key="String(exchange)" class="sub-row">
              <span class="sub-exchange">{{ exchange }}:</span>
              <span v-for="sym in symbols" :key="sym" class="tag-gray">{{ sym }}</span>
            </div>
          </template>
          <span v-else class="text-muted">None</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  exchanges: string[];
  subscriptions: Record<string, string[]>;
}>();
</script>

<style scoped>
.component-card {
  background: var(--q-card);
  border-radius: var(--q-card-radius);
  padding: var(--q-card-padding);
  box-shadow: var(--q-card-shadow);
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--q-primary-dark);
  margin-bottom: 16px;
}

.component-list {
  display: flex;
  gap: 0;
}

.component-item {
  flex: 1;
  padding: 0 20px;
}

.component-item:first-child { padding-left: 0; }
.component-item:last-child { padding-right: 0; }

.component-divider {
  width: 1px;
  background: var(--q-border);
  flex-shrink: 0;
}

.comp-info { margin-bottom: 8px; }

.comp-name {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--q-text);
}

.comp-desc {
  font-size: 11px;
  color: var(--q-text-muted);
}

.comp-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  flex-direction: column;
}

.tag-blue {
  background: var(--q-primary-light);
  color: var(--q-primary);
  padding: 2px 8px;
  border-radius: var(--q-tag-radius);
  font-size: 11px;
  display: inline-block;
}

.tag-gray {
  background: var(--q-hover);
  color: var(--q-text-secondary);
  padding: 1px 6px;
  border-radius: var(--q-tag-radius);
  font-size: 11px;
  display: inline-block;
}

.sub-row {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}

.sub-exchange {
  font-size: 11px;
  font-weight: 600;
  color: var(--q-text);
}

.text-muted {
  color: var(--q-text-muted);
  font-size: 12px;
}
</style>

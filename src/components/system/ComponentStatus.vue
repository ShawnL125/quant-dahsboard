<template>
  <a-card title="Component Status">
    <a-descriptions bordered :column="1" size="small">
      <a-descriptions-item label="Connected Exchanges">
        <a-space>
          <a-tag v-for="ex in exchanges" :key="ex" color="blue">{{ ex }}</a-tag>
          <span v-if="exchanges.length === 0" style="color: rgba(0,0,0,0.45)">None</span>
        </a-space>
      </a-descriptions-item>
      <a-descriptions-item label="Subscribed Symbols">
        <div v-if="Object.keys(subscriptions).length === 0" style="color: rgba(0,0,0,0.45)">None</div>
        <div v-for="(symbols, exchange) in subscriptions" :key="String(exchange)">
          <strong>{{ exchange }}:</strong>
          <a-tag v-for="sym in symbols" :key="sym" size="small" style="margin-left: 4px">{{ sym }}</a-tag>
        </div>
      </a-descriptions-item>
    </a-descriptions>
  </a-card>
</template>

<script setup lang="ts">
defineProps<{
  exchanges: string[];
  subscriptions: Record<string, string[]>;
}>();
</script>

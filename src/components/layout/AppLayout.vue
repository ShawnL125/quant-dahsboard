<template>
  <a-layout style="min-height: 100vh">
    <a-layout-sider v-model:collapsed="collapsed" collapsible>
      <div class="logo">
        <span v-if="!collapsed">Quant</span>
        <span v-else>Q</span>
      </div>
      <SideMenu />
    </a-layout-sider>
    <a-layout>
      <a-layout-header style="background: #fff; padding: 0 24px; display: flex; align-items: center; justify-content: space-between;">
        <div style="font-size: 16px; font-weight: 500;">{{ $route.name }}</div>
        <div style="display: flex; align-items: center; gap: 12px;">
          <a-tag v-if="paperTrading" color="orange">PAPER TRADING</a-tag>
          <a-badge :status="wsConnected ? 'success' : 'error'" :text="wsConnected ? 'Live' : 'Disconnected'" />
        </div>
      </a-layout-header>
      <a-layout-content style="margin: 16px; padding: 24px; background: #fff; border-radius: 8px;">
        <router-view />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script setup lang="ts">
import { ref, inject, type Ref } from 'vue';
import SideMenu from './SideMenu.vue';

const collapsed = ref(false);
const wsConnected = inject<Ref<boolean>>('wsConnected', ref(false));
const paperTrading = inject<Ref<boolean>>('paperTrading', ref(false));
</script>

<style scoped>
.logo {
  height: 32px;
  margin: 16px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 18px;
  font-weight: 700;
}
</style>

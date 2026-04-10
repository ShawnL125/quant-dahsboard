<template>
  <a-menu v-model:selectedKeys="selectedKeys" theme="dark" mode="inline" @click="onMenuClick">
    <a-menu-item key="/">
      <template #icon><DashboardOutlined /></template>
      <span>Dashboard</span>
    </a-menu-item>
    <a-menu-item key="/orders">
      <template #icon><SwapOutlined /></template>
      <span>Orders</span>
    </a-menu-item>
    <a-menu-item key="/strategies">
      <template #icon><ThunderboltOutlined /></template>
      <span>Strategies</span>
    </a-menu-item>
    <a-menu-item key="/backtest">
      <template #icon><LineChartOutlined /></template>
      <span>Backtest</span>
    </a-menu-item>
    <a-menu-item key="/system">
      <template #icon><SettingOutlined /></template>
      <span>System</span>
    </a-menu-item>
  </a-menu>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import {
  DashboardOutlined,
  SwapOutlined,
  ThunderboltOutlined,
  LineChartOutlined,
  SettingOutlined,
} from '@ant-design/icons-vue';

const router = useRouter();
const route = useRoute();
const selectedKeys = ref<string[]>([route.path]);

watch(() => route.path, (path) => { selectedKeys.value = [path]; });

function onMenuClick({ key }: { key: string }) { router.push(key); }
</script>

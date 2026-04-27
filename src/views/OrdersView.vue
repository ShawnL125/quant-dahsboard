<template>
  <div class="orders-page">
    <BaseSkeleton v-if="ordersStore.loading && ordersStore.openOrders.length === 0" variant="table" :rows="5" :columns="8" />
    <template v-else>
    <OrderForm @placed="onOrderPlaced" />

    <a-tabs v-model:activeKey="activeTab" class="orders-tabs">
      <a-tab-pane key="open" tab="Open Orders">
        <OpenOrdersTable
          :orders="ordersStore.openOrders"
          @cancel="onCancelOrder"
        />
      </a-tab-pane>
      <a-tab-pane key="history" tab="History">
        <OrderHistoryTable :orders="ordersStore.orderHistory" />
      </a-tab-pane>
      <a-tab-pane key="tracked" tab="Tracked Orders">
        <table v-if="ordersStore.trackedOrders.length > 0" class="data-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Strategy</th>
              <th>Symbol</th>
              <th>Side</th>
              <th>Type</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Filled</th>
              <th>Status</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="o in ordersStore.trackedOrders" :key="o.order_id">
              <td class="text-mono">{{ o.order_id.slice(0, 8) }}</td>
              <td>{{ o.strategy_id }}</td>
              <td class="text-bold">{{ o.symbol }}</td>
              <td><span class="side-pill" :class="o.side === 'BUY' ? 'side-buy' : 'side-sell'">{{ o.side }}</span></td>
              <td>{{ o.order_type }}</td>
              <td class="text-mono">{{ o.quantity }}</td>
              <td class="text-mono">{{ o.price || '-' }}</td>
              <td class="text-mono">{{ o.filled_quantity }}</td>
              <td><span class="status-pill" :class="statusClass(o.status)">{{ o.status }}</span></td>
              <td class="text-muted">{{ formatTime(o.updated_at) }}</td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty-state">No tracked orders</div>
      </a-tab-pane>
      <a-tab-pane key="sl-tp" tab="SL/TP Bindings">
        <table v-if="ordersStore.slBindings.length > 0" class="data-table">
          <thead>
            <tr>
              <th>Exchange</th>
              <th>Symbol</th>
              <th>Strategy</th>
              <th>SL Order</th>
              <th>TP Order</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="b in ordersStore.slBindings" :key="b.sl_order_id">
              <td>{{ b.exchange }}</td>
              <td class="text-bold">{{ b.symbol }}</td>
              <td>{{ b.strategy_id }}</td>
              <td class="text-mono">{{ b.sl_order_id.slice(0, 8) }}</td>
              <td class="text-mono">{{ b.tp_order_id.slice(0, 8) }}</td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty-state">No SL/TP bindings</div>
      </a-tab-pane>
      <a-tab-pane key="trailing" tab="Trailing Stops">
        <table v-if="ordersStore.trailingStops.length > 0" class="data-table">
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Exchange</th>
              <th>Side</th>
              <th>Activation</th>
              <th>Callback</th>
              <th>Current Stop</th>
              <th>High/Low</th>
              <th>Order</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="t in ordersStore.trailingStops" :key="t.order_id">
              <td class="text-bold">{{ t.symbol }}</td>
              <td>{{ t.exchange }}</td>
              <td><span class="side-pill" :class="t.is_long ? 'side-buy' : 'side-sell'">{{ t.is_long ? 'Long' : 'Short' }}</span></td>
              <td class="text-mono">{{ t.activation_price }}</td>
              <td class="text-mono">{{ t.callback_rate }}%</td>
              <td class="text-mono text-bold">{{ t.current_stop }}</td>
              <td class="text-mono">{{ t.highest_price }} / {{ t.lowest_price }}</td>
              <td>
                <a-popconfirm title="Deactivate this trailing stop? This removes your risk protection." @confirm="onDeactivateTrailing(t.order_id)">
                  <a-button size="small" danger>Deactivate</a-button>
                </a-popconfirm>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty-state">No trailing stops</div>
      </a-tab-pane>
      <a-tab-pane key="algo" tab="Algo Orders">
        <div class="algo-header">
          <a-button type="primary" size="small" @click="algoModalOpen = true">Submit Algo Order</a-button>
        </div>
        <table v-if="ordersStore.algoOrders.length > 0" class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Type</th>
              <th>Symbol</th>
              <th>Side</th>
              <th>Total Qty</th>
              <th>Filled</th>
              <th>Progress</th>
              <th>Slices</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="a in ordersStore.algoOrders" :key="a.algo_id">
              <td class="text-mono">{{ a.algo_id.slice(0, 8) }}</td>
              <td><span class="algo-type-pill">{{ a.algo_type.toUpperCase() }}</span></td>
              <td class="text-bold">{{ a.symbol }}</td>
              <td><span class="side-pill" :class="a.side === 'BUY' ? 'side-buy' : 'side-sell'">{{ a.side }}</span></td>
              <td class="text-mono">{{ a.total_quantity }}</td>
              <td class="text-mono">{{ a.filled_quantity }}</td>
              <td>
                <a-progress
                  :percent="parseFloat(a.progress_pct || '0')"
                  :stroke-color="parseFloat(a.progress_pct || '0') >= 100 ? 'var(--q-success)' : 'var(--q-primary)'"
                  size="small"
                  style="width: 80px"
                />
              </td>
              <td>{{ a.slices_completed }}/{{ a.slice_count }}</td>
              <td><span class="status-pill" :class="statusClass(a.status)">{{ a.status }}</span></td>
              <td>
                <div class="action-btns">
                  <a-button v-if="a.status === 'RUNNING'" size="small" @click="onPauseAlgo(a.algo_id)">Pause</a-button>
                  <a-button v-if="a.status === 'PAUSED'" size="small" type="primary" @click="onResumeAlgo(a.algo_id)">Resume</a-button>
                  <a-popconfirm v-if="a.status !== 'COMPLETED' && a.status !== 'CANCELLED'" title="Cancel this algo order? Running slices will be stopped." @confirm="onCancelAlgo(a.algo_id)">
                    <a-button size="small" danger>Cancel</a-button>
                  </a-popconfirm>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty-state">No algo orders</div>
      </a-tab-pane>
    </a-tabs>

    <!-- Algo Order Modal -->
    <a-modal v-model:open="algoModalOpen" title="Submit Algo Order" @ok="onSubmitAlgo" :confirm-loading="algoSubmitting">
      <a-form layout="vertical">
        <a-form-item label="Algorithm Type">
          <a-select v-model:value="algoForm.algo_type">
            <a-select-option value="twap">TWAP</a-select-option>
            <a-select-option value="vwap">VWAP</a-select-option>
            <a-select-option value="iceberg">Iceberg</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="Symbol">
          <a-input v-model:value="algoForm.symbol" placeholder="BTC/USDT" />
        </a-form-item>
        <a-form-item label="Exchange">
          <a-input v-model:value="algoForm.exchange" placeholder="binance" />
        </a-form-item>
        <a-form-item label="Side">
          <a-select v-model:value="algoForm.side">
            <a-select-option value="BUY">Buy</a-select-option>
            <a-select-option value="SELL">Sell</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="Quantity">
          <a-input v-model:value="algoForm.quantity" placeholder="0.01" />
        </a-form-item>
      </a-form>
    </a-modal>

    <a-alert
      v-if="ordersStore.error"
      :message="ordersStore.error"
      type="error"
      show-icon
      class="page-section"
    />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch, inject, type Ref } from 'vue';
import { useOrdersStore } from '@/stores/orders';
import type { Order, SubmitAlgoBody } from '@/types';
import OrderForm from '@/components/orders/OrderForm.vue';
import OpenOrdersTable from '@/components/orders/OpenOrdersTable.vue';
import OrderHistoryTable from '@/components/orders/OrderHistoryTable.vue';
import { message } from 'ant-design-vue';
import BaseSkeleton from '@/components/common/BaseSkeleton.vue';
import { usePolling } from '@/composables/usePolling';
import { POLL_ORDERS_MS } from '@/utils/constants';

const ordersStore = useOrdersStore();
const wsConnected = inject<Ref<boolean>>('wsConnected', ref(false));
const activeTab = ref('open');
const algoModalOpen = ref(false);
const algoSubmitting = ref(false);
const algoForm = reactive<SubmitAlgoBody>({
  algo_type: 'twap',
  symbol: '',
  exchange: '',
  side: 'BUY',
  quantity: '',
});

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
}

function statusClass(status: string): string {
  const s = status.toUpperCase();
  if (['FILLED', 'COMPLETED'].includes(s)) return 'status-ok';
  if (['CANCELED', 'CANCELLED', 'REJECTED', 'FAILED'].includes(s)) return 'status-error';
  if (['RUNNING', 'ACTIVE'].includes(s)) return 'status-active';
  return 'status-pending';
}

async function onOrderPlaced() {
  message.success('Order placed');
  await ordersStore.fetchOrders();
}

async function onCancelOrder(order: Order) {
  try {
    await ordersStore.cancelOrder(order.order_id, order.symbol, order.exchange);
    message.success('Order cancelled');
  } catch {
    message.error('Failed to cancel order');
  }
}

async function onDeactivateTrailing(orderId: string) {
  try {
    await ordersStore.deactivateTrailingStop(orderId);
    message.success('Trailing stop deactivated');
  } catch {
    message.error('Failed to deactivate');
  }
}

async function onSubmitAlgo() {
  algoSubmitting.value = true;
  try {
    await ordersStore.submitAlgoOrder({ ...algoForm });
    message.success('Algo order submitted');
    algoModalOpen.value = false;
    algoForm.symbol = '';
    algoForm.exchange = '';
    algoForm.quantity = '';
  } catch {
    message.error('Failed to submit algo order');
  } finally {
    algoSubmitting.value = false;
  }
}

async function onCancelAlgo(algoId: string) {
  try {
    await ordersStore.cancelAlgoOrder(algoId);
    message.success('Algo order cancelled');
  } catch {
    message.error('Failed to cancel algo order');
  }
}

async function onPauseAlgo(algoId: string) {
  try {
    await ordersStore.pauseAlgoOrder(algoId);
    message.success('Algo order paused');
  } catch {
    message.error('Failed to pause algo order');
  }
}

async function onResumeAlgo(algoId: string) {
  try {
    await ordersStore.resumeAlgoOrder(algoId);
    message.success('Algo order resumed');
  } catch {
    message.error('Failed to resume algo order');
  }
}

// Fetch OMS data when switching tabs
watch(activeTab, (tab) => {
  if (tab === 'tracked') ordersStore.fetchTrackedOrders();
  else if (tab === 'sl-tp') ordersStore.fetchSLBindings();
  else if (tab === 'trailing') ordersStore.fetchTrailingStops();
  else if (tab === 'algo') ordersStore.fetchAlgoOrders();
});

const polling = usePolling({
  fn: () => ordersStore.fetchOrders(),
  intervalMs: POLL_ORDERS_MS,
  immediate: false,
});

watch(wsConnected, (connected) => {
  if (connected) {
    polling.pause();
  } else {
    polling.resume();
  }
});

onMounted(() => {
  ordersStore.fetchOrders();
  if (!wsConnected.value) {
    polling.start();
  }
});
</script>

<style scoped>
.orders-page {
  display: flex;
  flex-direction: column;
  gap: var(--q-card-gap);
}

.page-section { margin-top: 0; }

.orders-tabs :deep(.ant-tabs-nav) {
  margin-bottom: 0;
}

.algo-header { margin-bottom: 12px; }

.data-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.data-table th { text-align: left; color: var(--q-text-muted); font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.02em; padding: 6px 0; }
.data-table td { padding: 8px 0; color: var(--q-text); border-bottom: 1px solid var(--q-border); }
.data-table tbody tr:last-child td { border-bottom: none; }
.data-table tbody tr:hover td { background: var(--q-hover); }

.text-bold { font-weight: 600; }
.text-muted { color: var(--q-text-muted); font-size: 11px; }
.text-mono { font-family: 'JetBrains Mono', monospace; font-size: 11px; }

.side-pill { display: inline-block; padding: 1px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; }
.side-buy { border: 1px solid var(--q-success); color: var(--q-success); background: transparent; }
.side-sell { border: 1px solid var(--q-error); color: var(--q-error); background: transparent; }

.status-pill { display: inline-block; padding: 1px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; background: transparent; }
.status-ok { border: 1px solid var(--q-success); color: var(--q-success); }
.status-error { border: 1px solid var(--q-error); color: var(--q-error); }
.status-active { border: 1px solid var(--q-primary); color: var(--q-primary); }
.status-pending { border: 1px solid var(--q-text-secondary); color: var(--q-text-secondary); }

.algo-type-pill { display: inline-block; padding: 1px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; border: 1px solid var(--q-warning); color: var(--q-warning); background: transparent; }

.action-btns { display: flex; gap: 4px; }

.empty-state { text-align: center; color: var(--q-text-muted); padding: 24px 0; font-size: 13px; }
</style>

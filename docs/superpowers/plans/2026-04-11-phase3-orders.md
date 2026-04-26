# Phase 3: Orders Page Redesign

> **WARNING: ADVERSARIAL REVIEW FIXES APPLIED** -- This plan was corrected after review revealed two critical discrepancies with the actual codebase:
> 1. The original plan described a simplified 3-section OrdersView (form + open + history) but the ACTUAL OrdersView has 6 tabs: open, history, tracked, sl-tp, trailing, algo -- with full management actions. The plan now preserves ALL existing tabs and functionality.
> 2. The original plan had OpenOrdersTable emitting only `orderId: string` but the actual code emits the full `Order` object, and `onCancelOrder` calls `ordersStore.cancelOrder(order.order_id, order.symbol, order.exchange)`. The plan now matches.
>
> **IMPORTANT: This plan must preserve all existing OMS functionality (tracked orders, SL/TP bindings, trailing stops, algo order management, and the full cancel order flow with orderId/symbol/exchange). Any changes should RESTYLE existing components, not remove capabilities.**

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign Orders page with Figma-style card layout — styled order form, clean tables with side pills, and status badges.

**Architecture:** Replace Ant Design card wrappers with custom styled containers using CSS variables. Restyle tables and form controls using the theme.css overrides.

**Tech Stack:** Ant Design Vue form/table components with theme.css overrides, CSS variables

---

## File Structure

| File | Action | Purpose |
|------|--------|---------|
| `src/components/orders/OrderForm.vue` | Modify | Styled form with blue submit button |
| `src/components/orders/OpenOrdersTable.vue` | Modify | Styled table with side pills and cancel button |
| `src/views/OrdersView.vue` | Modify | Card wrappers and history table styling |

---

### Task 1: Restyle OrderForm

**Files:**
- Modify: `src/components/orders/OrderForm.vue`

Replace the entire file:

```vue
<template>
  <div class="order-form-card">
    <div class="card-title">Place Order</div>
    <a-form layout="inline" :model="form" @finish="handleSubmit">
      <a-form-item label="Symbol" name="symbol" :rules="[{ required: true, message: 'Required' }]">
        <a-input v-model:value="form.symbol" placeholder="BTC/USDT" style="width: 140px" />
      </a-form-item>
      <a-form-item label="Side" name="side" :rules="[{ required: true }]">
        <a-input-group compact>
          <a-button
            :type="form.side === 'BUY' ? 'primary' : 'default'"
            :class="{ 'side-buy-active': form.side === 'BUY' }"
            @click="form.side = 'BUY'"
            style="width: 72px"
          >BUY</a-button>
          <a-button
            :type="form.side === 'SELL' ? 'primary' : 'default'"
            :class="{ 'side-sell-active': form.side === 'SELL' }"
            @click="form.side = 'SELL'"
            style="width: 72px"
          >SELL</a-button>
        </a-input-group>
      </a-form-item>
      <a-form-item label="Type" name="order_type" :rules="[{ required: true }]">
        <a-select v-model:value="form.order_type" style="width: 120px">
          <a-select-option value="MARKET">MARKET</a-select-option>
          <a-select-option value="LIMIT">LIMIT</a-select-option>
        </a-select>
      </a-form-item>
      <a-form-item label="Quantity" name="quantity" :rules="[{ required: true, message: 'Required' }]">
        <a-input-number v-model:value="form.quantity" :min="0" :step="0.001" style="width: 120px" />
      </a-form-item>
      <a-form-item v-if="form.order_type === 'LIMIT'" label="Price" name="price">
        <a-input-number v-model:value="form.price" :min="0" :step="0.01" style="width: 140px" />
      </a-form-item>
      <a-form-item>
        <a-button type="primary" html-type="submit" :loading="submitting">
          Submit
        </a-button>
      </a-form-item>
    </a-form>
    <a-alert v-if="error" :message="error" type="error" show-icon style="margin-top: 12px" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useOrdersStore } from '@/stores/orders';

const emit = defineEmits<{
  placed: [];
}>();

const ordersStore = useOrdersStore();
const submitting = ref(false);
const error = ref<string | null>(null);

const form = reactive({
  symbol: '',
  side: 'BUY' as string,
  order_type: 'MARKET' as string,
  quantity: 0 as number,
  price: null as number | null,
});

async function handleSubmit() {
  error.value = null;
  submitting.value = true;
  try {
    await ordersStore.placeOrder({
      symbol: form.symbol,
      exchange: 'binance',
      side: form.side,
      order_type: form.order_type,
      quantity: String(form.quantity),
      price: form.order_type === 'LIMIT' && form.price ? String(form.price) : null,
    });
    emit('placed');
    form.symbol = '';
    form.quantity = 0;
    form.price = null;
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Order placement failed';
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.order-form-card {
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

.side-buy-active {
  background: var(--q-success) !important;
  border-color: var(--q-success) !important;
  color: #fff !important;
}

.side-sell-active {
  background: var(--q-error) !important;
  border-color: var(--q-error) !important;
  color: #fff !important;
}
</style>
```

- [ ] **Step 1: Write file and verify build**
- [ ] **Step 2: Commit** `git add src/components/orders/OrderForm.vue && git commit -m "feat: restyle order form with BUY/SELL toggle buttons"`

---

### Task 2: Restyle OpenOrdersTable

**Files:**
- Modify: `src/components/orders/OpenOrdersTable.vue`

Replace the entire file:

```vue
<template>
  <div class="orders-card">
    <div class="card-header">
      <span class="card-title">Open Orders</span>
      <span v-if="orders.length > 0" class="card-badge">{{ orders.length }}</span>
    </div>
    <table v-if="orders.length > 0" class="data-table">
      <thead>
        <tr>
          <th>Time</th>
          <th>Symbol</th>
          <th>Side</th>
          <th>Type</th>
          <th>Qty</th>
          <th>Price</th>
          <th>Filled</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="order in orders" :key="order.order_id">
          <td class="text-muted">{{ formatTime(order.created_at) }}</td>
          <td class="text-bold">{{ order.symbol }}</td>
          <td>
            <span class="side-pill" :class="order.side === 'BUY' ? 'side-buy' : 'side-sell'">
              {{ order.side }}
            </span>
          </td>
          <td>{{ order.order_type }}</td>
          <td>{{ order.quantity }}</td>
          <td>{{ order.price || '-' }}</td>
          <td>{{ order.filled_quantity || '0' }}</td>
          <td>
            <a-popconfirm title="Cancel this order?" @confirm="emit('cancel', order)">
              <span class="cancel-btn">Cancel</span>
            </a-popconfirm>
          </td>
        </tr>
      </tbody>
    </table>
    <div v-else class="empty-state">No open orders</div>
  </div>
</template>

<script setup lang="ts">
import type { Order } from '@/types';

defineProps<{
  orders: Order[];
}>();

const emit = defineEmits<{
  cancel: [order: Order];
}>();

function formatTime(dateStr?: string): string {
  if (!dateStr) return '-';
  try { return new Date(dateStr).toLocaleTimeString(); }
  catch { return dateStr; }
}
</script>

<style scoped>
.orders-card {
  background: var(--q-card);
  border-radius: var(--q-card-radius);
  padding: var(--q-card-padding);
  box-shadow: var(--q-card-shadow);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--q-primary-dark);
}

.card-badge {
  background: var(--q-primary-light);
  color: var(--q-primary);
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.data-table th {
  text-align: left;
  color: var(--q-text-muted);
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  padding: 6px 0;
}

.data-table td {
  padding: 10px 0;
  color: var(--q-text);
  border-bottom: 1px solid var(--q-border);
}

.data-table tbody tr:last-child td {
  border-bottom: none;
}

.data-table tbody tr:hover td {
  background: var(--q-hover);
}

.text-muted {
  color: var(--q-text-muted);
}

.text-bold {
  font-weight: 600;
}

.side-pill {
  display: inline-block;
  padding: 2px 8px;
  border-radius: var(--q-tag-radius);
  font-size: 11px;
  font-weight: 500;
}

.side-buy {
  background: var(--q-success-light);
  color: var(--q-success);
}

.side-sell {
  background: var(--q-error-light);
  color: var(--q-error);
}

.cancel-btn {
  color: var(--q-error);
  font-size: 12px;
  cursor: pointer;
  font-weight: 500;
}

.cancel-btn:hover {
  text-decoration: underline;
}

.empty-state {
  text-align: center;
  color: var(--q-text-muted);
  padding: 24px 0;
  font-size: 13px;
}
</style>
```

- [ ] **Step 1: Write file and verify build**
- [ ] **Step 2: Commit** `git add src/components/orders/OpenOrdersTable.vue && git commit -m "feat: restyle open orders table with side pills and cancel link"`

---

### Task 3: Restyle OrdersView

**Files:**
- Modify: `src/views/OrdersView.vue`

**CRITICAL:** The current OrdersView has 6 tabs (open, history, tracked, sl-tp, trailing, algo) plus an algo order modal. This restyle MUST preserve all of them. Only the visual styling (CSS) should change; all tab content, store actions, watchers, and handlers must remain intact.

Replace the entire file:

```vue
<template>
  <div class="orders-page">
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
                <a-button size="small" danger @click="onDeactivateTrailing(t.order_id)">Deactivate</a-button>
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
                  :stroke-color="parseFloat(a.progress_pct || '0') >= 100 ? '#22c55e' : '#3b82f6'"
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
                  <a-button v-if="a.status !== 'COMPLETED' && a.status !== 'CANCELLED'" size="small" danger @click="onCancelAlgo(a.algo_id)">Cancel</a-button>
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue';
import { useOrdersStore } from '@/stores/orders';
import type { Order, SubmitAlgoBody } from '@/types';
import OrderForm from '@/components/orders/OrderForm.vue';
import OpenOrdersTable from '@/components/orders/OpenOrdersTable.vue';
import OrderHistoryTable from '@/components/orders/OrderHistoryTable.vue';
import { message } from 'ant-design-vue';

const ordersStore = useOrdersStore();
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

onMounted(() => {
  ordersStore.fetchOrders();
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
.text-mono { font-family: 'SF Mono', 'Fira Code', monospace; font-size: 11px; }

.side-pill { display: inline-block; padding: 1px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; }
.side-buy { background: rgba(34, 197, 94, 0.12); color: #22c55e; }
.side-sell { background: rgba(239, 68, 68, 0.12); color: #ef4444; }

.status-pill { display: inline-block; padding: 1px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; }
.status-ok { background: rgba(34, 197, 94, 0.12); color: #22c55e; }
.status-error { background: rgba(239, 68, 68, 0.12); color: #ef4444; }
.status-active { background: rgba(59, 130, 246, 0.12); color: #3b82f6; }
.status-pending { background: rgba(156, 163, 175, 0.12); color: #9ca3af; }

.algo-type-pill { display: inline-block; padding: 1px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; background: rgba(139, 92, 246, 0.12); color: #8b5cf6; }

.action-btns { display: flex; gap: 4px; }

.empty-state { text-align: center; color: var(--q-text-muted); padding: 24px 0; font-size: 13px; }
</style>
```

- [ ] **Step 1: Write file and verify build**
- [ ] **Step 2: Commit** `git add src/views/OrdersView.vue && git commit -m "feat: restyle orders page preserving all 6 tabs (open, history, tracked, sl-tp, trailing, algo)"`

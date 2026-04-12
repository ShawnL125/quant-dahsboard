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

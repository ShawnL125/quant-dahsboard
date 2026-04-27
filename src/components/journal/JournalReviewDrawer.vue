<template>
  <a-drawer
    :open="open"
    title="Review Journal Entry"
    :width="480"
    @close="$emit('close')"
  >
    <template v-if="entry">
      <div class="entry-summary">
        <div class="summary-row">
          <span class="summary-label">Strategy</span>
          <span class="text-mono">{{ entry.strategy_id }}</span>
        </div>
        <div class="summary-row">
          <span class="summary-label">Symbol</span>
          <span class="text-bold">{{ entry.symbol }}</span>
        </div>
        <div class="summary-row">
          <span class="summary-label">Side</span>
          <span class="side-pill" :class="entry.side === 'BUY' ? 'side-buy' : 'side-sell'">{{ entry.side }}</span>
        </div>
        <div class="summary-row">
          <span class="summary-label">Entry Price</span>
          <span class="text-mono">{{ entry.entry_price }}</span>
        </div>
        <div class="summary-row">
          <span class="summary-label">Exit Price</span>
          <span class="text-mono">{{ entry.exit_price ?? '-' }}</span>
        </div>
        <div class="summary-row">
          <span class="summary-label">Quantity</span>
          <span class="text-mono">{{ entry.quantity }}</span>
        </div>
        <div class="summary-row">
          <span class="summary-label">PNL</span>
          <span class="text-mono" :class="pnlClass">{{ formatPnl }}</span>
        </div>
        <div v-if="entry.notes" class="summary-row summary-notes">
          <span class="summary-label">Notes</span>
          <span class="notes-text">{{ entry.notes }}</span>
        </div>
      </div>

      <div class="review-form">
        <div class="form-section-title">Review</div>
        <a-form layout="vertical">
          <a-form-item label="Review Notes">
            <a-textarea
              v-model:value="form.review_notes"
              :rows="4"
              placeholder="What went well? What could be improved?"
            />
          </a-form-item>
          <a-form-item label="Action Items (one per line)">
            <a-textarea
              v-model:value="form.action_items_str"
              :rows="3"
              placeholder="Reduce position size&#10;Wait for confirmation&#10;Review stop loss"
            />
          </a-form-item>
        </a-form>
      </div>
    </template>

    <div v-else class="empty-state">No entry selected</div>

    <template #footer>
      <div class="drawer-footer">
        <a-button @click="$emit('close')">Cancel</a-button>
        <a-button type="primary" :disabled="!entry" @click="onSubmit">Submit Review</a-button>
      </div>
    </template>
  </a-drawer>
</template>

<script setup lang="ts">
import { reactive, computed, watch } from 'vue';
import type { JournalEntry } from '@/types';

const props = defineProps<{
  open: boolean;
  entry: JournalEntry | null;
}>();

const emit = defineEmits<{
  close: [];
  submit: [entryId: string, data: { review_notes: string; action_items: string[] }];
}>();

const form = reactive({
  review_notes: '',
  action_items_str: '',
});

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    form.review_notes = '';
    form.action_items_str = '';
  }
});

const pnlValue = computed(() => parseFloat(props.entry?.realized_pnl ?? '0'));

const formatPnl = computed(() => {
  if (isNaN(pnlValue.value)) return '-';
  const prefix = pnlValue.value >= 0 ? '+' : '';
  return prefix + pnlValue.value.toFixed(2);
});

const pnlClass = computed(() => {
  if (isNaN(pnlValue.value) || pnlValue.value === 0) return '';
  return pnlValue.value > 0 ? 'val-positive' : 'val-negative';
});

function onSubmit() {
  if (!props.entry) return;
  const actionItems = form.action_items_str
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  emit('submit', props.entry.entry_id, {
    review_notes: form.review_notes,
    action_items: actionItems,
  });
}
</script>

<style scoped>
.entry-summary {
  background: var(--q-card);
  border-radius: var(--q-card-radius);
  padding: 16px;
  margin-bottom: 20px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  border-bottom: 1px solid var(--q-border);
}

.summary-row:last-child {
  border-bottom: none;
}

.summary-label {
  font-size: 12px;
  color: var(--q-text-muted);
}

.summary-notes {
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.notes-text {
  font-size: 12px;
  color: var(--q-text);
  line-height: 1.5;
}

.side-pill {
  display: inline-block;
  padding: 1px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
}

.side-buy {
  border: 1px solid var(--q-success);
  color: var(--q-success);
  background: transparent;
}

.side-sell {
  border: 1px solid var(--q-error);
  color: var(--q-error);
  background: transparent;
}

.val-positive { color: var(--q-success); }
.val-negative { color: var(--q-error); }

.text-bold { font-weight: 600; }
.text-mono { font-family: 'SF Mono', 'Fira Code', monospace; font-size: 11px; }

.review-form {
  margin-top: 8px;
}

.form-section-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--q-primary-dark);
  margin-bottom: 12px;
}

.drawer-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.empty-state {
  text-align: center;
  color: var(--q-text-muted);
  padding: 24px 0;
  font-size: 13px;
}
</style>

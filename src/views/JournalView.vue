<template>
  <div class="journal-page">
    <a-spin :spinning="store.loading">
      <JournalReport :report="store.report" :pending-count="store.pendingCount" />

      <div v-if="store.pendingCount > 0" class="pending-banner page-section">
        <span class="pending-text">{{ store.pendingCount }} entries pending review</span>
        <a-button size="small" @click="activeTab = 'pending'">Review Now</a-button>
      </div>

      <a-tabs v-model:activeKey="activeTab" class="page-section">
        <a-tab-pane key="pending" :tab="`Pending (${store.pendingCount})`">
          <JournalEntryTable
            :entries="pendingEntries"
            @review="onReview"
            @edit="onEdit"
            @dismiss="onDismiss"
          />
        </a-tab-pane>
        <a-tab-pane key="all" tab="All Entries">
          <JournalEntryTable
            :entries="store.entries"
            @review="onReview"
            @edit="onEdit"
            @dismiss="onDismiss"
          />
        </a-tab-pane>
      </a-tabs>
    </a-spin>

    <!-- Review Drawer -->
    <JournalReviewDrawer
      :open="reviewDrawerOpen"
      :entry="selectedEntry"
      @close="reviewDrawerOpen = false"
      @submit="onSubmitReview"
    />

    <!-- Edit Modal -->
    <a-modal
      v-model:open="editModalOpen"
      title="Edit Journal Entry"
      @ok="onSaveEdit"
      :confirm-loading="saving"
    >
      <a-form layout="vertical">
        <a-form-item label="Notes">
          <a-textarea v-model:value="editForm.notes" :rows="3" />
        </a-form-item>
        <a-form-item label="Tags (comma-separated)">
          <a-input v-model:value="editForm.tagsStr" />
        </a-form-item>
        <a-form-item label="Rating (1-5)">
          <a-input-number
            v-model:value="editForm.rating"
            :min="1"
            :max="5"
            style="width: 100%"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useJournalStore } from '@/stores/journal';
import type { JournalEntry } from '@/types';
import { message } from 'ant-design-vue';
import JournalReport from '@/components/journal/JournalReport.vue';
import JournalEntryTable from '@/components/journal/JournalEntryTable.vue';
import JournalReviewDrawer from '@/components/journal/JournalReviewDrawer.vue';

const store = useJournalStore();

const activeTab = ref('pending');
const selectedEntry = ref<JournalEntry | null>(null);
const reviewDrawerOpen = ref(false);
const editModalOpen = ref(false);
const saving = ref(false);

const editForm = reactive({
  notes: '',
  tagsStr: '',
  rating: null as number | null,
});

const pendingEntries = computed(() =>
  store.entries.filter((e) => e.status === 'pending'),
);

function onReview(entry: JournalEntry) {
  selectedEntry.value = entry;
  reviewDrawerOpen.value = true;
}

function onEdit(entry: JournalEntry) {
  selectedEntry.value = entry;
  editForm.notes = entry.notes;
  editForm.tagsStr = entry.tags.join(', ');
  editForm.rating = entry.rating;
  editModalOpen.value = true;
}

async function onDismiss(entryId: string) {
  try {
    await store.dismissEntry(entryId);
    message.success('Entry dismissed');
  } catch {
    message.error('Failed to dismiss entry');
  }
}

async function onSubmitReview(entryId: string, data: { review_notes: string; action_items: string[] }) {
  try {
    await store.reviewEntry(entryId, data);
    reviewDrawerOpen.value = false;
    selectedEntry.value = null;
    message.success('Review submitted');
  } catch {
    message.error('Failed to submit review');
  }
}

async function onSaveEdit() {
  if (!selectedEntry.value) return;
  saving.value = true;
  try {
    const tags = editForm.tagsStr
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    await store.updateEntry(selectedEntry.value.entry_id, {
      notes: editForm.notes,
      tags,
      rating: editForm.rating,
    });
    editModalOpen.value = false;
    selectedEntry.value = null;
    message.success('Entry updated');
  } catch {
    message.error('Failed to update entry');
  } finally {
    saving.value = false;
  }
}

onMounted(async () => {
  store.loading = true;
  try {
    await Promise.all([
      store.fetchEntries(),
      store.fetchReport(),
      store.fetchPendingCount(),
    ]);
  } finally {
    store.loading = false;
  }
});
</script>

<style scoped>
.journal-page {
  display: flex;
  flex-direction: column;
  gap: var(--q-card-gap);
}

.page-section {
  margin-top: var(--q-card-gap);
}

.pending-banner {
  background: rgba(255, 152, 0, 0.08);
  border: 1px solid rgba(255, 152, 0, 0.2);
  border-radius: var(--q-card-radius);
  padding: 10px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pending-text {
  font-size: 13px;
  font-weight: 500;
  color: var(--q-primary-dark);
}

.journal-page :deep(.ant-tabs-nav) {
  margin-bottom: 0;
}
</style>

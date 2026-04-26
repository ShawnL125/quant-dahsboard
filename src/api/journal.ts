import apiClient from './client';
import type { JournalEntry, JournalReport } from '@/types';

export const journalApi = {
  getEntries: (params?: { strategy_id?: string; symbol?: string; limit?: number; offset?: number }) =>
    apiClient.get<{ data: JournalEntry[] }>('/journal/entries', { params }).then((r) => r.data),

  getEntry: (entryId: string) =>
    apiClient.get<{ data: JournalEntry }>(`/journal/entries/${entryId}`).then((r) => r.data),

  updateEntry: (entryId: string, data: { notes?: string; tags?: string[]; rating?: number }) =>
    apiClient.patch<{ data: JournalEntry }>(`/journal/entries/${entryId}`, data).then((r) => r.data),

  reviewEntry: (entryId: string, data: { review_notes?: string; action_items?: string[] }) =>
    apiClient.post<{ data: JournalEntry }>(`/journal/entries/${entryId}/review`, data).then((r) => r.data),

  dismissEntry: (entryId: string) =>
    apiClient.post<{ data: { dismissed: boolean } }>(`/journal/entries/${entryId}/dismiss`).then((r) => r.data),

  getReport: (params?: { strategy_id?: string; days?: number }) =>
    apiClient.get<{ data: JournalReport }>('/journal/report', { params }).then((r) => r.data),

  getPendingCount: () =>
    apiClient.get<{ data: { count: number } }>('/journal/pending-count').then((r) => r.data),
};

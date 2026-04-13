import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { riskApi } from '@/api/risk';
import type { RiskStatus, ExposureData, RiskEvent, RiskConfig, DrawdownPoint } from '@/types';

const DEFAULT_EVENTS_PAGE_SIZE = 20;
const MAX_DRAWDOWN_HISTORY = 600;
const MAX_REALTIME_EVENT_IDS = 200;

export const useRiskStore = defineStore('risk', () => {
  const status = ref<RiskStatus | null>(null);
  const exposure = ref<ExposureData | null>(null);
  const eventsById = ref<Record<string, RiskEvent>>({});
  const eventPageIds = ref<Record<number, string[]>>({});
  const realtimeEventIds = ref<string[]>([]);
  const currentEventsPage = ref(1);
  const eventsPageSize = ref(DEFAULT_EVENTS_PAGE_SIZE);
  const events = computed(() =>
    (eventPageIds.value[currentEventsPage.value] ?? [])
      .map((eventId) => eventsById.value[eventId])
      .filter((event): event is RiskEvent => event !== undefined),
  );
  const eventsTotal = ref(0);
  const config = ref<RiskConfig | null>(null);
  const drawdownHistory = ref<DrawdownPoint[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  function buildEventId(payload: Record<string, unknown>, time: string): string {
    const rawEventId = payload.event_id ?? payload.id;
    if ((typeof rawEventId === 'string' || typeof rawEventId === 'number') && String(rawEventId).length > 0) {
      return String(rawEventId);
    }

    return [
      time,
      String(payload.event_type ?? payload.action ?? ''),
      String(payload.level ?? ''),
      String(payload.target ?? ''),
      String(payload.reason ?? ''),
    ].join(':');
  }

  function normalizeRiskEvent(payload: RiskEvent | Record<string, unknown>, serverTimestamp?: string): RiskEvent {
    const rawPayload = isRecord(payload) ? payload : {};
    const time =
      serverTimestamp ??
      (typeof rawPayload.time === 'string' && rawPayload.time.length > 0
        ? rawPayload.time
        : typeof rawPayload.timestamp === 'string' && rawPayload.timestamp.length > 0
          ? rawPayload.timestamp
          : new Date().toISOString());
    const metadata = isRecord(rawPayload.metadata) ? rawPayload.metadata : rawPayload;

    return {
      event_id: buildEventId(rawPayload, time),
      time,
      event_type: String(rawPayload.event_type ?? rawPayload.action ?? ''),
      level: String(rawPayload.level ?? ''),
      target: String(rawPayload.target ?? ''),
      reason: String(rawPayload.reason ?? ''),
      metadata,
    };
  }

  function mergeUniqueIds(ids: string[]): string[] {
    return [...new Set(ids.filter((id) => id.length > 0))];
  }

  function upsertEvent(event: RiskEvent): boolean {
    const existing = eventsById.value[event.event_id];
    eventsById.value[event.event_id] = existing ? { ...existing, ...event } : event;
    return existing === undefined;
  }

  function updateEventPage(page: number, fetchedIds: string[], pageSize = eventsPageSize.value) {
    const nextPageIds =
      page === 1
        ? mergeUniqueIds([...realtimeEventIds.value, ...fetchedIds]).slice(0, pageSize)
        : mergeUniqueIds(fetchedIds);

    eventPageIds.value = {
      ...eventPageIds.value,
      [page]: nextPageIds,
    };
  }

  function mergeRealtimeEvent(eventId: string) {
    eventPageIds.value = Object.fromEntries(
      Object.entries(eventPageIds.value).map(([page, ids]) => [
        page,
        page === '1' ? ids : ids.filter((id) => id !== eventId),
      ]),
    ) as Record<number, string[]>;
    realtimeEventIds.value = mergeUniqueIds([eventId, ...realtimeEventIds.value]).slice(0, MAX_REALTIME_EVENT_IDS);
    updateEventPage(1, eventPageIds.value[1] ?? [], eventsPageSize.value);
  }

  function appendDrawdownSample(value: number) {
    const previousSample = drawdownHistory.value.at(-1);
    if (previousSample?.value === value) {
      return;
    }

    drawdownHistory.value = [
      ...drawdownHistory.value,
      { time: Date.now(), value },
    ].slice(-MAX_DRAWDOWN_HISTORY);
  }

  async function fetchStatus() {
    try {
      const data = await riskApi.getStatus();
      status.value = data;
      return data;
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e);
      return null;
    }
  }

  async function fetchExposure() {
    try {
      exposure.value = await riskApi.getExposure();
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e);
    }
  }

  async function fetchEvents(limit = eventsPageSize.value, offset = (currentEventsPage.value - 1) * eventsPageSize.value) {
    try {
      const data = await riskApi.getEvents(limit, offset);
      const page = Math.floor(offset / limit) + 1;
      const normalizedEvents = data.events.map((event) => normalizeRiskEvent(event));

      currentEventsPage.value = page;
      eventsPageSize.value = limit;

      normalizedEvents.forEach((event) => {
        upsertEvent(event);
      });

      updateEventPage(page, normalizedEvents.map((event) => event.event_id), limit);
      eventsTotal.value = Math.max(eventsTotal.value, data.total);
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e);
    }
  }

  async function fetchConfig() {
    try {
      config.value = await riskApi.getConfig();
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e);
    }
  }

  async function fetchAll() {
    loading.value = true;
    try {
      await Promise.all([fetchStatus(), fetchExposure(), fetchEvents(), fetchConfig()]);
    } finally {
      loading.value = false;
    }
  }

  async function postKillSwitch(payload: { level: 'GLOBAL' | 'SYMBOL' | 'STRATEGY'; target?: string; reason?: string; activate: boolean }) {
    try {
      await riskApi.postKillSwitch(payload);
      await Promise.all([fetchStatus(), fetchExposure()]);
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e);
    }
  }

  function updateFromWS(data: Record<string, unknown>, serverTimestamp?: string) {
    const wsEvent = normalizeRiskEvent(data, serverTimestamp);
    const isNewEvent = upsertEvent(wsEvent);

    mergeRealtimeEvent(wsEvent.event_id);

    if (isNewEvent) {
      eventsTotal.value += 1;
    }

    void Promise.all([fetchStatus(), fetchExposure()]);
  }

  async function sampleDrawdown() {
    const latestStatus = await fetchStatus();
    if (latestStatus?.drawdown) {
      appendDrawdownSample(latestStatus.drawdown.current_pct);
    }
  }

  return {
    status,
    exposure,
    events,
    currentEventsPage,
    eventsPageSize,
    eventsTotal,
    config,
    drawdownHistory,
    loading,
    error,
    fetchStatus,
    fetchExposure,
    fetchEvents,
    fetchConfig,
    fetchAll,
    postKillSwitch,
    sampleDrawdown,
    updateFromWS,
  };
});

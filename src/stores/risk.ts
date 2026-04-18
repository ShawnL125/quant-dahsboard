import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { riskApi } from '@/api/risk';
import type {
  RiskStatus,
  ExposureData,
  RiskEvent,
  RiskConfig,
  DrawdownPoint,
  KillSwitchExpectedState,
  KillSwitchPayload,
} from '@/types';

const DEFAULT_EVENTS_PAGE_SIZE = 20;
const MAX_DRAWDOWN_HISTORY = 600;
const MAX_REALTIME_EVENT_IDS = 200;
const DRAWDOWN_DEDUP_WINDOW_MS = 15_000;
const DRAWDOWN_VALUE_EPSILON = 1e-6;

type KillSwitchRequest = Omit<KillSwitchPayload, 'expected_state' | 'idempotency_key'> & {
  expected_state?: KillSwitchExpectedState;
  idempotency_key?: string;
};

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
    const metadata = isRecord(payload.metadata) ? payload.metadata : null;
    const rawEventId = payload.event_id ?? payload.id ?? metadata?.event_id ?? metadata?.id;
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

  function mergeEvents(nextEvents: RiskEvent[]) {
    const eventIds: string[] = [];
    let insertedCount = 0;

    nextEvents.forEach((event) => {
      eventIds.push(event.event_id);
      if (upsertEvent(event)) {
        insertedCount += 1;
      }
    });

    return {
      eventIds: mergeUniqueIds(eventIds),
      insertedCount,
    };
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

  function appendDrawdownSample(value: number, sampleTime = Date.now()) {
    const previousSample = drawdownHistory.value.at(-1);
    if (
      previousSample &&
      Math.abs(previousSample.value - value) <= DRAWDOWN_VALUE_EPSILON &&
      sampleTime - previousSample.time < DRAWDOWN_DEDUP_WINDOW_MS
    ) {
      return;
    }

    drawdownHistory.value = [
      ...drawdownHistory.value,
      { time: sampleTime, value },
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
      const { eventIds } = mergeEvents(normalizedEvents);

      currentEventsPage.value = page;
      eventsPageSize.value = limit;

      updateEventPage(page, eventIds, limit);
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

  function getKillSwitchActive(level: KillSwitchPayload['level'], target?: string): boolean {
    if (!status.value) {
      return false;
    }

    switch (level) {
      case 'GLOBAL':
        return status.value.kill_switch.global.active;
      case 'SYMBOL':
        return target !== undefined && target.length > 0 ? target in status.value.kill_switch.symbols : false;
      case 'STRATEGY':
        return target !== undefined && target.length > 0 ? target in status.value.kill_switch.strategies : false;
    }
  }

  function buildKillSwitchPayload(payload: KillSwitchRequest): KillSwitchPayload {
    const reason = payload.reason.trim();
    if (reason.length === 0) {
      throw new Error('Kill-switch reason is required');
    }

    return {
      ...payload,
      reason,
      expected_state: payload.expected_state ?? { active: getKillSwitchActive(payload.level, payload.target) },
      idempotency_key: payload.idempotency_key ?? crypto.randomUUID(),
    };
  }

  async function postKillSwitch(payload: KillSwitchRequest) {
    try {
      const request = buildKillSwitchPayload(payload);
      await riskApi.postKillSwitch(request);
      await Promise.all([fetchStatus(), fetchExposure()]);
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e);
    }
  }

  function updateFromWS(data: Record<string, unknown>, serverTimestamp?: string) {
    const wsEvent = normalizeRiskEvent(data, serverTimestamp);
    const { insertedCount } = mergeEvents([wsEvent]);

    mergeRealtimeEvent(wsEvent.event_id);

    if (insertedCount > 0) {
      eventsTotal.value += insertedCount;
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

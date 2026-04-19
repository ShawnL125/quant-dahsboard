import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import SystemView from '@/views/SystemView.vue';
import HealthStatus from '@/components/system/HealthStatus.vue';
import ComponentStatus from '@/components/system/ComponentStatus.vue';
import ConnectorHealthCards from '@/components/quality/ConnectorHealthCards.vue';
import QualityAlertsFeed from '@/components/quality/QualityAlertsFeed.vue';

// ── Shared mutable mock state ──────────────────────────────────────
let mockSystemLoading = false;
let mockLiveness: Record<string, unknown> | null = null;
let mockReadiness: Record<string, unknown> | null = null;
let mockStatus: Record<string, unknown> | null = null;
let mockConfig: Record<string, unknown> | null = null;
let mockEventStats: Record<string, number> | null = null;

let mockQualityLoading = false;
let mockAlerts: Record<string, unknown>[] = [];
let mockHealthReady: Record<string, unknown> | null = null;
let mockSystemStatus: Record<string, unknown> | null = null;

let mockReconAlerts: Record<string, unknown>[] = [];
let mockReconLoading = false;

// ── Mock functions ─────────────────────────────────────────────────
const mockSystemFetchAll = vi.fn().mockResolvedValue(undefined);
const mockReloadConfig = vi.fn().mockResolvedValue(undefined);
const mockQualityFetchAll = vi.fn().mockResolvedValue(undefined);
const mockReconFetchAll = vi.fn().mockResolvedValue(undefined);

// ── Store mocks ────────────────────────────────────────────────────
vi.mock('@/stores/system', () => ({
  useSystemStore: () => ({
    get loading() { return mockSystemLoading; },
    get liveness() { return mockLiveness; },
    get readiness() { return mockReadiness; },
    get status() { return mockStatus; },
    get config() { return mockConfig; },
    get eventStats() { return mockEventStats; },
    fetchAll: mockSystemFetchAll,
    reloadConfig: mockReloadConfig,
  }),
}));

vi.mock('@/stores/quality', () => ({
  useQualityStore: () => ({
    get loading() { return mockQualityLoading; },
    get alerts() { return mockAlerts; },
    get healthReady() { return mockHealthReady; },
    get systemStatus() { return mockSystemStatus; },
    fetchAll: mockQualityFetchAll,
  }),
}));

vi.mock('@/stores/reconciliation', () => ({
  useReconciliationStore: () => ({
    get alerts() { return mockReconAlerts; },
    get loading() { return mockReconLoading; },
    fetchAll: mockReconFetchAll,
  }),
}));

// ── Ant Design Vue stubs ──────────────────────────────────────────
const antStubs = {
  'a-spin': {
    template: '<div class="a-spin-stub" :data-spinning="spinning"><slot /></div>',
    props: ['spinning'],
  },
  'a-collapse': {
    template: '<div class="a-collapse-stub"><slot /></div>',
  },
  'a-collapse-panel': {
    template: '<div class="a-collapse-panel-stub"><slot /></div>',
    props: ['header', 'key'],
  },
  'a-button': {
    template: '<button class="a-button-stub" :data-loading="loading" @click="$emit(\'click\')"><slot /></button>',
    props: ['loading', 'size'],
    emits: ['click'],
  },
};

function mountSystem() {
  return mount(SystemView, { global: { stubs: antStubs } });
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();

  mockSystemLoading = false;
  mockLiveness = null;
  mockReadiness = null;
  mockStatus = null;
  mockConfig = null;
  mockEventStats = null;

  mockQualityLoading = false;
  mockAlerts = [];
  mockHealthReady = null;
  mockSystemStatus = null;

  mockReconAlerts = [];
  mockReconLoading = false;
});

afterEach(() => {
  vi.useRealTimers();
});

// ===================================================================
describe('SystemView', () => {
  // ── Rendering basics ───────────────────────────────────────────

  it('renders the .system-page container', async () => {
    const wrapper = mountSystem();
    await flushPromises();
    expect(wrapper.find('.system-page').exists()).toBe(true);
  });

  it('passes spinning prop to a-spin from store.loading', async () => {
    mockSystemLoading = true;
    const wrapper = mountSystem();
    await flushPromises();
    const spin = wrapper.find('.a-spin-stub');
    expect(spin.exists()).toBe(true);
    expect(spin.attributes('data-spinning')).toBe('true');
  });

  // ── onMounted: store initialisation ────────────────────────────

  it('calls store.fetchAll, qualityStore.fetchAll, reconStore.fetchAll on mount', async () => {
    mountSystem();
    await flushPromises();
    expect(mockSystemFetchAll).toHaveBeenCalledOnce();
    expect(mockQualityFetchAll).toHaveBeenCalledTimes(1);
    expect(mockReconFetchAll).toHaveBeenCalledOnce();
  });

  // ── qualityTimer: setInterval 15 000 ms ───────────────────────

  it('sets up a quality refresh interval that calls qualityStore.fetchAll every 15 s', async () => {
    mountSystem();
    await flushPromises();
    // 1 call from onMounted, clear it
    expect(mockQualityFetchAll).toHaveBeenCalledTimes(1);
    mockQualityFetchAll.mockClear();

    vi.advanceTimersByTime(15_000);
    await flushPromises();
    expect(mockQualityFetchAll).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(15_000);
    await flushPromises();
    expect(mockQualityFetchAll).toHaveBeenCalledTimes(2);
  });

  it('stops the quality interval on unmount', async () => {
    const wrapper = mountSystem();
    await flushPromises();
    mockQualityFetchAll.mockClear();

    wrapper.unmount();
    vi.advanceTimersByTime(60_000);
    await flushPromises();
    expect(mockQualityFetchAll).not.toHaveBeenCalled();
  });

  // ── Child component rendering ─────────────────────────────────

  it('renders HealthStatus component', async () => {
    const wrapper = mountSystem();
    await flushPromises();
    expect(wrapper.findComponent(HealthStatus).exists()).toBe(true);
  });

  it('renders ComponentStatus component', async () => {
    const wrapper = mountSystem();
    await flushPromises();
    expect(wrapper.findComponent(ComponentStatus).exists()).toBe(true);
  });

  it('renders ConnectorHealthCards component', async () => {
    const wrapper = mountSystem();
    await flushPromises();
    expect(wrapper.findComponent(ConnectorHealthCards).exists()).toBe(true);
  });

  it('renders QualityAlertsFeed component', async () => {
    const wrapper = mountSystem();
    await flushPromises();
    expect(wrapper.findComponent(QualityAlertsFeed).exists()).toBe(true);
  });

  // ── Child component props ─────────────────────────────────────

  it('passes liveness and readiness to HealthStatus', async () => {
    mockLiveness = { status: 'ok', uptime_seconds: 42 };
    mockReadiness = { status: 'ready', uptime_seconds: 40 };
    const wrapper = mountSystem();
    await flushPromises();
    const hs = wrapper.findComponent(HealthStatus);
    expect(hs.props('liveness')).toEqual({ status: 'ok', uptime_seconds: 42 });
    expect(hs.props('readiness')).toEqual({ status: 'ready', uptime_seconds: 40 });
  });

  it('passes null liveness/readiness to HealthStatus when not loaded', async () => {
    const wrapper = mountSystem();
    await flushPromises();
    const hs = wrapper.findComponent(HealthStatus);
    expect(hs.props('liveness')).toBeNull();
    expect(hs.props('readiness')).toBeNull();
  });

  it('passes exchanges and subscriptions to ComponentStatus', async () => {
    mockStatus = {
      connected_exchanges: ['binance', 'okx'],
      subscribed_symbols: { BTCUSDT: ['binance'] },
    };
    const wrapper = mountSystem();
    await flushPromises();
    const cs = wrapper.findComponent(ComponentStatus);
    expect(cs.props('exchanges')).toEqual(['binance', 'okx']);
    expect(cs.props('subscriptions')).toEqual({ BTCUSDT: ['binance'] });
  });

  it('passes empty arrays for exchanges/subscriptions when status is null', async () => {
    mockStatus = null;
    const wrapper = mountSystem();
    await flushPromises();
    const cs = wrapper.findComponent(ComponentStatus);
    expect(cs.props('exchanges')).toEqual([]);
    expect(cs.props('subscriptions')).toEqual({});
  });

  it('passes connectors from healthReady to ConnectorHealthCards when available', async () => {
    const connectors = { binance: { ready: true } };
    mockHealthReady = { status: 'ok', connectors };
    const wrapper = mountSystem();
    await flushPromises();
    const card = wrapper.findComponent(ConnectorHealthCards);
    expect(card.props('connectors')).toEqual(connectors);
  });

  it('falls back to systemStatus.connectors when healthReady is null', async () => {
    mockHealthReady = null;
    const connectors = { okx: { ready: false } };
    mockSystemStatus = { connectors };
    const wrapper = mountSystem();
    await flushPromises();
    const card = wrapper.findComponent(ConnectorHealthCards);
    expect(card.props('connectors')).toEqual(connectors);
  });

  it('passes null to ConnectorHealthCards when both healthReady and systemStatus are null', async () => {
    mockHealthReady = null;
    mockSystemStatus = null;
    const wrapper = mountSystem();
    await flushPromises();
    const card = wrapper.findComponent(ConnectorHealthCards);
    expect(card.props('connectors')).toBeNull();
  });

  it('passes alerts array to QualityAlertsFeed', async () => {
    mockAlerts = [
      { alert_type: 'data_gap', symbol: 'BTCUSDT', exchange: 'binance', severity: 'critical' },
    ] as Record<string, unknown>[];
    const wrapper = mountSystem();
    await flushPromises();
    const feed = wrapper.findComponent(QualityAlertsFeed);
    expect(feed.props('alerts')).toEqual(mockAlerts);
  });

  // ── formatJson: config display ────────────────────────────────

  it('displays "No configuration loaded" when config is null', async () => {
    mockConfig = null;
    const wrapper = mountSystem();
    await flushPromises();
    expect(wrapper.find('.config-code').text()).toBe('No configuration loaded');
  });

  it('displays JSON-formatted config when config is an object', async () => {
    mockConfig = { trading: { mode: 'paper' }, exchanges: ['binance'] };
    const wrapper = mountSystem();
    await flushPromises();
    const code = wrapper.find('.config-code').text();
    expect(code).toContain('"trading"');
    expect(code).toContain('"mode"');
    expect(code).toContain('"paper"');
    expect(code).toContain('"exchanges"');
  });

  it('falls back to String() for non-serializable values (circular reference)', async () => {
    // A circular reference causes JSON.stringify to throw
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    mockConfig = circular as unknown as Record<string, unknown>;
    const wrapper = mountSystem();
    await flushPromises();
    const code = wrapper.find('.config-code').text();
    // String() on a circular object produces "[object Object]"
    expect(code).toBe('[object Object]');
  });

  // ── Reload config button ──────────────────────────────────────

  it('renders a Reload Config button inside the config section', async () => {
    const wrapper = mountSystem();
    await flushPromises();
    const buttons = wrapper.findAll('.a-button-stub');
    const reloadBtn = buttons.find((b) => b.text().includes('Reload Config'));
    expect(reloadBtn).toBeDefined();
  });

  it('calls store.reloadConfig when Reload Config button is clicked', async () => {
    const wrapper = mountSystem();
    await flushPromises();
    const buttons = wrapper.findAll('.a-button-stub');
    const reloadBtn = buttons.find((b) => b.text().includes('Reload Config'))!;
    await reloadBtn.trigger('click');
    await flushPromises();
    expect(mockReloadConfig).toHaveBeenCalledOnce();
  });

  it('sets reloading to true while reloadConfig is pending and false after', async () => {
    let resolveReload: () => void = () => {};
    mockReloadConfig.mockReturnValue(new Promise<void>((r) => { resolveReload = r; }));

    const wrapper = mountSystem();
    await flushPromises();
    const buttons = wrapper.findAll('.a-button-stub');
    const reloadBtn = buttons.find((b) => b.text().includes('Reload Config'))!;

    await reloadBtn.trigger('click');
    await flushPromises();
    // While pending, the button should have the loading prop set to "true"
    expect(reloadBtn.attributes('data-loading')).toBe('true');

    resolveReload();
    await flushPromises();
    // After resolved, loading should be cleared (prop re-rendered as "false")
    expect(reloadBtn.attributes('data-loading')).toBe('false');
  });

  // ── Refresh quality button ────────────────────────────────────

  it('renders a Refresh button in the quality section', async () => {
    const wrapper = mountSystem();
    await flushPromises();
    const qualitySection = wrapper.find('.quality-section');
    expect(qualitySection.exists()).toBe(true);
    const refreshBtn = qualitySection.findAll('.a-button-stub').find((b) => b.text() === 'Refresh');
    expect(refreshBtn).toBeDefined();
  });

  it('calls qualityStore.fetchAll when the quality Refresh button is clicked', async () => {
    const wrapper = mountSystem();
    await flushPromises();
    mockQualityFetchAll.mockClear();

    const qualitySection = wrapper.find('.quality-section');
    const refreshBtn = qualitySection.findAll('.a-button-stub').find((b) => b.text() === 'Refresh')!;
    await refreshBtn.trigger('click');
    await flushPromises();
    expect(mockQualityFetchAll).toHaveBeenCalledOnce();
  });

  // ── eventRows computed / Event Statistics table ────────────────

  it('shows empty state when eventStats is null', async () => {
    mockEventStats = null;
    const wrapper = mountSystem();
    await flushPromises();
    const eventsCard = wrapper.find('.events-card');
    expect(eventsCard.find('.data-table').exists()).toBe(false);
    expect(eventsCard.find('.empty-state').text()).toBe('No event statistics available');
  });

  it('shows empty state when eventStats is an empty object', async () => {
    mockEventStats = {};
    const wrapper = mountSystem();
    await flushPromises();
    const eventsCard = wrapper.find('.events-card');
    expect(eventsCard.find('.data-table').exists()).toBe(false);
    expect(eventsCard.find('.empty-state').text()).toBe('No event statistics available');
  });

  it('renders a table with rows when eventStats has data', async () => {
    mockEventStats = { order_fill: 12, trade_created: 5, position_opened: 3 };
    const wrapper = mountSystem();
    await flushPromises();
    const eventsCard = wrapper.find('.events-card');

    expect(eventsCard.find('.data-table').exists()).toBe(true);
    expect(eventsCard.find('.empty-state').exists()).toBe(false);

    const rows = eventsCard.findAll('tbody tr');
    expect(rows).toHaveLength(3);

    // Check first row content
    const cells0 = rows[0].findAll('td');
    expect(cells0[0].text()).toBe('order_fill');
    expect(cells0[1].text()).toBe('12');

    const cells1 = rows[1].findAll('td');
    expect(cells1[0].text()).toBe('trade_created');
    expect(cells1[1].text()).toBe('5');

    const cells2 = rows[2].findAll('td');
    expect(cells2[0].text()).toBe('position_opened');
    expect(cells2[1].text()).toBe('3');
  });

  it('renders table headers for Event Statistics', async () => {
    mockEventStats = { order_fill: 1 };
    const wrapper = mountSystem();
    await flushPromises();
    const headers = wrapper.find('.events-card').findAll('th');
    expect(headers.map((h) => h.text())).toEqual(['Event Type', 'Count']);
  });

  // ── Reconciliation alerts table ───────────────────────────────

  it('shows empty state when reconStore.alerts is empty', async () => {
    mockReconAlerts = [];
    const wrapper = mountSystem();
    await flushPromises();
    const reconCard = wrapper.find('.recon-card');
    expect(reconCard.find('.data-table').exists()).toBe(false);
    expect(reconCard.find('.empty-state').text()).toBe('No reconciliation alerts');
  });

  it('renders recon alerts table with level pills for each alert', async () => {
    mockReconAlerts = [
      { alert_id: 'a1', level: 'critical', alert_type: 'trade_mismatch', message: 'Trade not found', data: {} },
      { alert_id: 'a2', level: 'warning', alert_type: 'price_drift', message: 'Price drifted 2%', data: {} },
      { alert_id: 'a3', level: 'info', alert_type: 'sync_ok', message: 'All synced', data: {} },
    ] as Record<string, unknown>[];
    const wrapper = mountSystem();
    await flushPromises();
    const reconCard = wrapper.find('.recon-card');

    expect(reconCard.find('.data-table').exists()).toBe(true);
    expect(reconCard.find('.empty-state').exists()).toBe(false);

    const rows = reconCard.findAll('tbody tr');
    expect(rows).toHaveLength(3);

    // Check level pills have correct CSS classes
    const pill0 = rows[0].find('.level-pill');
    expect(pill0.classes()).toContain('level-critical');
    expect(pill0.text()).toBe('critical');

    const pill1 = rows[1].find('.level-pill');
    expect(pill1.classes()).toContain('level-warning');
    expect(pill1.text()).toBe('warning');

    const pill2 = rows[2].find('.level-pill');
    expect(pill2.classes()).toContain('level-info');
    expect(pill2.text()).toBe('info');
  });

  it('renders correct alert_type and message in recon table rows', async () => {
    mockReconAlerts = [
      { alert_id: 'a1', level: 'critical', alert_type: 'trade_mismatch', message: 'Trade 42 not found', data: {} },
    ] as Record<string, unknown>[];
    const wrapper = mountSystem();
    await flushPromises();
    const cells = wrapper.find('.recon-card').findAll('tbody tr')[0].findAll('td');
    expect(cells[1].text()).toBe('trade_mismatch');
    expect(cells[2].text()).toBe('Trade 42 not found');
  });

  it('renders table headers for Reconciliation Alerts', async () => {
    mockReconAlerts = [
      { alert_id: 'a1', level: 'info', alert_type: 'sync', message: 'ok', data: {} },
    ] as Record<string, unknown>[];
    const wrapper = mountSystem();
    await flushPromises();
    const headers = wrapper.find('.recon-card').findAll('th');
    expect(headers.map((h) => h.text())).toEqual(['Level', 'Type', 'Message']);
  });

  // ── Recon Refresh button ──────────────────────────────────────

  it('renders a Refresh button in the recon section', async () => {
    const wrapper = mountSystem();
    await flushPromises();
    const reconCard = wrapper.find('.recon-card');
    const refreshBtn = reconCard.findAll('.a-button-stub').find((b) => b.text() === 'Refresh');
    expect(refreshBtn).toBeDefined();
  });

  it('calls reconStore.fetchAll when the recon Refresh button is clicked', async () => {
    const wrapper = mountSystem();
    await flushPromises();
    mockReconFetchAll.mockClear();

    const reconCard = wrapper.find('.recon-card');
    const refreshBtn = reconCard.findAll('.a-button-stub').find((b) => b.text() === 'Refresh')!;
    await refreshBtn.trigger('click');
    await flushPromises();
    expect(mockReconFetchAll).toHaveBeenCalledOnce();
  });

  // ── Quality section structure ─────────────────────────────────

  it('renders the quality section with correct title', async () => {
    const wrapper = mountSystem();
    await flushPromises();
    const section = wrapper.find('.quality-section');
    expect(section.find('.section-title').text()).toBe('Data Quality Monitoring');
  });

  // ── Events card structure ─────────────────────────────────────

  it('renders the events card with correct title', async () => {
    const wrapper = mountSystem();
    await flushPromises();
    expect(wrapper.find('.events-card .card-title').text()).toBe('Event Statistics');
  });

  // ── Recon card structure ──────────────────────────────────────

  it('renders the recon card with correct title', async () => {
    const wrapper = mountSystem();
    await flushPromises();
    expect(wrapper.find('.recon-card .card-title').text()).toBe('Reconciliation Alerts');
  });

  // ── Config section structure ──────────────────────────────────

  it('renders the config section with collapse panel', async () => {
    const wrapper = mountSystem();
    await flushPromises();
    expect(wrapper.find('.config-card').exists()).toBe(true);
    expect(wrapper.find('.a-collapse-stub').exists()).toBe(true);
    expect(wrapper.find('.config-code').exists()).toBe(true);
  });

  // ── Default fallback for unknown level ────────────────────────

  it('applies level-info class for unrecognized alert levels', async () => {
    mockReconAlerts = [
      { alert_id: 'a4', level: 'unknown', alert_type: 'test', message: 'test msg', data: {} },
    ] as Record<string, unknown>[];
    const wrapper = mountSystem();
    await flushPromises();
    const pill = wrapper.find('.recon-card .level-pill');
    expect(pill.classes()).toContain('level-info');
    expect(pill.classes()).not.toContain('level-critical');
    expect(pill.classes()).not.toContain('level-warning');
  });
});

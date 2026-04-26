import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAlertsStore } from '@/stores/alerts';
import { alertsApi } from '@/api/alerts';
import type { AlertRule, CreateAlertRule, UpdateAlertRule, AlertFiring } from '@/types';

// ── Mocks ────────────────────────────────────────────────────────────
vi.mock('@/api/alerts', () => ({
  alertsApi: {
    listRules: vi.fn(),
    createRule: vi.fn(),
    updateRule: vi.fn(),
    deleteRule: vi.fn(),
    listFirings: vi.fn(),
    getActiveAlerts: vi.fn(),
    manualEvaluate: vi.fn(),
  },
}));

const mockedApi = vi.mocked(alertsApi);

// ── Fixtures ─────────────────────────────────────────────────────────
const fakeRule: AlertRule = {
  rule_id: 'r1',
  name: 'Drawdown Alert',
  alert_type: 'threshold',
  enabled: true,
  conditions: { metric: 'drawdown', operator: '>', value: 0.1 },
  cooldown_seconds: 300,
  severity: 'high',
};

const fakeRule2: AlertRule = {
  ...fakeRule,
  rule_id: 'r2',
  name: 'PnL Alert',
};

const fakeFiring: AlertFiring = {
  firing_id: 'f1',
  rule_id: 'r1',
  alert_type: 'threshold',
  severity: 'high',
  message: 'Drawdown exceeded',
  actual_value: '0.15',
  threshold: '0.10',
  fired_at: '2026-01-01T10:00:00Z',
  resolved_at: null,
};

const fakeFiring2: AlertFiring = {
  ...fakeFiring,
  firing_id: 'f2',
  rule_id: 'r2',
  message: 'PnL drop',
};

// ── Tests ────────────────────────────────────────────────────────────
describe('alerts store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Initial State ─────────────────────────────────────────────────
  describe('initial state', () => {
    it('has empty rules', () => {
      const store = useAlertsStore();
      expect(store.rules).toEqual([]);
    });

    it('has empty firings', () => {
      const store = useAlertsStore();
      expect(store.firings).toEqual([]);
    });

    it('has empty activeAlerts', () => {
      const store = useAlertsStore();
      expect(store.activeAlerts).toEqual([]);
    });

    it('has loading false and error null', () => {
      const store = useAlertsStore();
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
    });
  });

  // ── fetchRules ────────────────────────────────────────────────────
  describe('fetchRules()', () => {
    it('sets rules on success', async () => {
      mockedApi.listRules.mockResolvedValue({ data: [fakeRule, fakeRule2] });

      const store = useAlertsStore();
      await store.fetchRules();

      expect(store.rules).toEqual([fakeRule, fakeRule2]);
    });

    it('passes params to API', async () => {
      mockedApi.listRules.mockResolvedValue({ data: [fakeRule] });

      const store = useAlertsStore();
      await store.fetchRules({ alert_type: 'threshold', enabled_only: true });

      expect(mockedApi.listRules).toHaveBeenCalledWith({ alert_type: 'threshold', enabled_only: true });
    });

    it('sets rules to empty on failure', async () => {
      mockedApi.listRules.mockRejectedValue(new Error('fail'));

      const store = useAlertsStore();
      await store.fetchRules();

      expect(store.rules).toEqual([]);
    });
  });

  // ── createRule ────────────────────────────────────────────────────
  describe('createRule()', () => {
    const createData: CreateAlertRule = {
      rule_id: 'r1',
      name: 'Drawdown Alert',
      alert_type: 'threshold',
    };

    it('appends new rule to list', async () => {
      mockedApi.createRule.mockResolvedValue({ data: fakeRule });

      const store = useAlertsStore();
      store.rules = [fakeRule2];
      await store.createRule(createData);

      expect(store.rules).toHaveLength(2);
      expect(store.rules[1]).toEqual(fakeRule);
      expect(mockedApi.createRule).toHaveBeenCalledWith(createData);
    });

    it('sets error on failure and rethrows', async () => {
      mockedApi.createRule.mockRejectedValue(new Error('create fail'));

      const store = useAlertsStore();
      await expect(store.createRule(createData)).rejects.toThrow('create fail');

      expect(store.error).toBe('create fail');
    });
  });

  // ── updateRule ────────────────────────────────────────────────────
  describe('updateRule()', () => {
    const updateData: UpdateAlertRule = { enabled: false };
    const updatedRule = { ...fakeRule, enabled: false };

    it('updates rule in list', async () => {
      mockedApi.updateRule.mockResolvedValue({ data: updatedRule });

      const store = useAlertsStore();
      store.rules = [fakeRule, fakeRule2];
      await store.updateRule('r1', updateData);

      expect(store.rules[0]).toEqual(updatedRule);
      expect(mockedApi.updateRule).toHaveBeenCalledWith('r1', updateData);
    });

    it('sets error on failure and rethrows', async () => {
      mockedApi.updateRule.mockRejectedValue(new Error('update fail'));

      const store = useAlertsStore();
      store.rules = [fakeRule];
      await expect(store.updateRule('r1', updateData)).rejects.toThrow('update fail');

      expect(store.error).toBe('update fail');
    });
  });

  // ── deleteRule ────────────────────────────────────────────────────
  describe('deleteRule()', () => {
    it('removes rule from list', async () => {
      mockedApi.deleteRule.mockResolvedValue({ data: { rule_id: 'r1', deleted: true } });

      const store = useAlertsStore();
      store.rules = [fakeRule, fakeRule2];
      await store.deleteRule('r1');

      expect(store.rules).toHaveLength(1);
      expect(store.rules[0].rule_id).toBe('r2');
      expect(mockedApi.deleteRule).toHaveBeenCalledWith('r1');
    });

    it('sets error on failure and rethrows', async () => {
      mockedApi.deleteRule.mockRejectedValue(new Error('delete fail'));

      const store = useAlertsStore();
      store.rules = [fakeRule];
      await expect(store.deleteRule('r1')).rejects.toThrow('delete fail');

      expect(store.error).toBe('delete fail');
    });
  });

  // ── fetchFirings ──────────────────────────────────────────────────
  describe('fetchFirings()', () => {
    it('sets firings on success', async () => {
      mockedApi.listFirings.mockResolvedValue({ data: [fakeFiring], total: 1 });

      const store = useAlertsStore();
      await store.fetchFirings({ status: 'active', limit: 50 });

      expect(store.firings).toEqual([fakeFiring]);
      expect(mockedApi.listFirings).toHaveBeenCalledWith({ status: 'active', limit: 50 });
    });

    it('sets firings to empty on failure', async () => {
      mockedApi.listFirings.mockRejectedValue(new Error('fail'));

      const store = useAlertsStore();
      await store.fetchFirings();

      expect(store.firings).toEqual([]);
    });
  });

  // ── fetchActiveAlerts ─────────────────────────────────────────────
  describe('fetchActiveAlerts()', () => {
    it('sets activeAlerts on success', async () => {
      mockedApi.getActiveAlerts.mockResolvedValue({ data: [fakeFiring] });

      const store = useAlertsStore();
      await store.fetchActiveAlerts();

      expect(store.activeAlerts).toEqual([fakeFiring]);
    });

    it('sets activeAlerts to empty on failure', async () => {
      mockedApi.getActiveAlerts.mockRejectedValue(new Error('fail'));

      const store = useAlertsStore();
      await store.fetchActiveAlerts();

      expect(store.activeAlerts).toEqual([]);
    });
  });

  // ── fetchAll ──────────────────────────────────────────────────────
  describe('fetchAll()', () => {
    it('calls fetchRules and fetchActiveAlerts in parallel', async () => {
      mockedApi.listRules.mockResolvedValue({ data: [fakeRule] });
      mockedApi.getActiveAlerts.mockResolvedValue({ data: [fakeFiring] });

      const store = useAlertsStore();
      await store.fetchAll();

      expect(mockedApi.listRules).toHaveBeenCalledOnce();
      expect(mockedApi.getActiveAlerts).toHaveBeenCalledOnce();
      expect(store.loading).toBe(false);
    });

    it('sets loading during request', async () => {
      let resolveRules!: (v: unknown) => void;
      mockedApi.listRules.mockReturnValue(new Promise((r) => { resolveRules = r; }) as any);
      mockedApi.getActiveAlerts.mockResolvedValue({ data: [] });

      const store = useAlertsStore();
      const promise = store.fetchAll();

      expect(store.loading).toBe(true);

      resolveRules({ data: [] });
      await promise;

      expect(store.loading).toBe(false);
    });
  });

  // ── updateAlertFromWS ─────────────────────────────────────────────
  describe('updateAlertFromWS()', () => {
    it('adds new firing to firings list', () => {
      const store = useAlertsStore();
      store.firings = [fakeFiring2];

      store.updateAlertFromWS(fakeFiring as unknown as Record<string, unknown>);

      expect(store.firings).toHaveLength(2);
      expect(store.firings[0]).toEqual(fakeFiring);
    });

    it('updates existing firing in firings list', () => {
      const store = useAlertsStore();
      store.firings = [fakeFiring];
      const updated = { ...fakeFiring, message: 'Updated' };

      store.updateAlertFromWS(updated as unknown as Record<string, unknown>);

      expect(store.firings).toHaveLength(1);
      expect(store.firings[0].message).toBe('Updated');
    });

    it('adds new active alert when not resolved', () => {
      const store = useAlertsStore();
      store.activeAlerts = [];

      store.updateAlertFromWS(fakeFiring as unknown as Record<string, unknown>);

      expect(store.activeAlerts).toHaveLength(1);
      expect(store.activeAlerts[0]).toEqual(fakeFiring);
    });

    it('removes active alert when resolved', () => {
      const store = useAlertsStore();
      store.activeAlerts = [fakeFiring];
      const resolved = { ...fakeFiring, resolved_at: '2026-01-01T11:00:00Z' };

      store.updateAlertFromWS(resolved as unknown as Record<string, unknown>);

      expect(store.activeAlerts).toHaveLength(0);
    });

    it('does nothing when firing_id is missing', () => {
      const store = useAlertsStore();
      store.firings = [fakeFiring];
      store.activeAlerts = [fakeFiring];

      store.updateAlertFromWS({ message: 'no id' } as Record<string, unknown>);

      expect(store.firings).toHaveLength(1);
      expect(store.activeAlerts).toHaveLength(1);
    });

    it('does nothing when data is empty', () => {
      const store = useAlertsStore();
      store.firings = [fakeFiring];

      store.updateAlertFromWS({} as Record<string, unknown>);

      expect(store.firings).toHaveLength(1);
    });
  });
});

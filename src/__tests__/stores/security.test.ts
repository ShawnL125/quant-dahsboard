import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSecurityStore } from '@/stores/security';
import { securityApi } from '@/api/security';
import type { SecurityAuditEntry, SecurityAuditSummary } from '@/types';

// ── Mocks ────────────────────────────────────────────────────────────
vi.mock('@/api/security', () => ({
  securityApi: {
    getAudit: vi.fn(),
    getSummary: vi.fn(),
  },
}));

const mockedApi = vi.mocked(securityApi);

// ── Fixtures ─────────────────────────────────────────────────────────
const fakeEntry: SecurityAuditEntry = {
  audit_id: 'aud-1',
  category: 'authentication',
  severity: 'high',
  finding: 'Weak password policy detected',
  recommendation: 'Enforce minimum 12 character passwords',
  detected_at: '2026-01-01T00:00:00Z',
  resolved_at: null,
  metadata: { source: 'policy-check' },
};

const fakeSummary: SecurityAuditSummary = {
  total_findings: 10,
  by_severity: { high: 2, medium: 5, low: 3 },
  by_category: { authentication: 3, network: 7 },
  unresolved_count: 4,
  last_audit_at: '2026-01-01T00:00:00Z',
};

// ── Tests ────────────────────────────────────────────────────────────
describe('security store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Initial State ─────────────────────────────────────────────────
  describe('initial state', () => {
    it('has empty entries', () => {
      const store = useSecurityStore();
      expect(store.entries).toEqual([]);
    });

    it('has null summary', () => {
      const store = useSecurityStore();
      expect(store.summary).toBeNull();
    });

    it('is not loading', () => {
      const store = useSecurityStore();
      expect(store.loading).toBe(false);
    });

    it('has null error', () => {
      const store = useSecurityStore();
      expect(store.error).toBeNull();
    });
  });

  // ── fetchAudit ────────────────────────────────────────────────────
  describe('fetchAudit()', () => {
    it('sets entries on success', async () => {
      mockedApi.getAudit.mockResolvedValue({ data: [fakeEntry] });
      const store = useSecurityStore();
      await store.fetchAudit();
      expect(store.entries).toEqual([fakeEntry]);
    });

    it('clears entries on failure', async () => {
      mockedApi.getAudit.mockRejectedValue(new Error('fail'));
      const store = useSecurityStore();
      store.entries = [fakeEntry];
      await store.fetchAudit();
      expect(store.entries).toEqual([]);
    });

    it('passes params to API', async () => {
      mockedApi.getAudit.mockResolvedValue({ data: [] });
      const store = useSecurityStore();
      await store.fetchAudit({ category: 'network', limit: 10 });
      expect(mockedApi.getAudit).toHaveBeenCalledWith({ category: 'network', limit: 10 });
    });
  });

  // ── fetchSummary ──────────────────────────────────────────────────
  describe('fetchSummary()', () => {
    it('sets summary on success', async () => {
      mockedApi.getSummary.mockResolvedValue({ data: fakeSummary });
      const store = useSecurityStore();
      await store.fetchSummary();
      expect(store.summary).toEqual(fakeSummary);
    });

    it('clears summary on failure', async () => {
      mockedApi.getSummary.mockRejectedValue(new Error('fail'));
      const store = useSecurityStore();
      store.summary = fakeSummary;
      await store.fetchSummary();
      expect(store.summary).toBeNull();
    });
  });
});

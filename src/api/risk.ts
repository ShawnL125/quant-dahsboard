import apiClient from './client';
import type { RiskStatus, ExposureData, RiskEventsResponse, RiskConfig, KillSwitchPayload } from '@/types';

export const riskApi = {
  getStatus: () =>
    apiClient.get<RiskStatus>('/risk/status').then((r) => r.data),

  getExposure: () =>
    apiClient.get<ExposureData>('/risk/exposure').then((r) => r.data),

  getEvents: (limit = 20, offset = 0) =>
    apiClient.get<RiskEventsResponse>('/risk/events', { params: { limit, offset } }).then((r) => r.data),

  getConfig: () =>
    apiClient.get<RiskConfig>('/risk/config').then((r) => r.data),

  postKillSwitch: (payload: KillSwitchPayload) =>
    apiClient.post('/risk/kill-switch', payload).then((r) => r.data),
};

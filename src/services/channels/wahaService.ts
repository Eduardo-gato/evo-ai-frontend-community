import api from '@/services/core/api';
import { extractData } from '@/utils/apiHelpers';

export interface WahaConnectionParams {
  apiUrl?: string;
  apiKey?: string;
  session?: string;
  engine?: string;
  webhookHmacKey?: string;
  ignoreGroups?: boolean;
  ignoreStatus?: boolean;
  ignoreChannels?: boolean;
  ignoreBroadcast?: boolean;
  mode?: 'test' | 'create';
  name?: string;
}

export interface WahaResponse {
  success?: boolean;
  session?: string;
  engine?: string;
  webhook_hmac_key?: string;
  qrcode?: unknown;
  status?: string;
  reused?: boolean;
  provider_config?: Record<string, unknown>;
  data?: Record<string, unknown>;
  provider_connection?: { connection?: string };
}

const toAuthorizationParams = (params: WahaConnectionParams): Record<string, unknown> => {
  const payload: Record<string, unknown> = {};
  if (params.apiUrl !== undefined) payload.api_url = params.apiUrl;
  if (params.apiKey !== undefined) payload.api_key = params.apiKey;
  if (params.session !== undefined) payload.session = params.session;
  if (params.engine !== undefined) payload.engine = params.engine;
  if (params.webhookHmacKey !== undefined) payload.webhook_hmac_key = params.webhookHmacKey;
  if (params.ignoreGroups !== undefined) payload.ignore_groups = params.ignoreGroups;
  if (params.ignoreStatus !== undefined) payload.ignore_status = params.ignoreStatus;
  if (params.ignoreChannels !== undefined) payload.ignore_channels = params.ignoreChannels;
  if (params.ignoreBroadcast !== undefined) payload.ignore_broadcast = params.ignoreBroadcast;
  if (params.name !== undefined) payload.name = params.name;
  if (params.mode !== undefined) payload.mode = params.mode;
  return payload;
};

const WahaService = {
  async verifyConnection(params: WahaConnectionParams) {
    const response = await api.post('/waha/authorization', {
      authorization: toAuthorizationParams({ ...params, mode: 'test' }),
    });
    return extractData<WahaResponse>(response);
  },

  async createSession(params: WahaConnectionParams) {
    const response = await api.post('/waha/authorization', {
      authorization: toAuthorizationParams({ ...params, mode: 'create' }),
    });
    return extractData<WahaResponse>(response);
  },

  async getQRCode(session: string) {
    const response = await api.get(`/waha/qrcodes/${encodeURIComponent(session)}`);
    return extractData<WahaResponse>(response);
  },

  async connect(session: string) {
    const response = await api.post('/waha/authorization/connect', { session });
    return extractData<WahaResponse>(response);
  },

  async fetch(session: string) {
    const response = await api.get('/waha/authorization/fetch', { params: { session } });
    return extractData<WahaResponse>(response);
  },

  async logout(session: string) {
    const response = await api.post('/waha/authorization/logout', { session });
    return extractData<WahaResponse>(response);
  },

  async syncWebhook(session: string) {
    const response = await api.post('/waha/authorization/sync_webhook', { session });
    return extractData<WahaResponse>(response);
  },

  async updateSettings(params: {
    session: string;
    useGlobal?: boolean;
    apiUrl?: string;
    apiKey?: string;
  }) {
    const response = await api.put('/waha/settings', {
      session: params.session,
      use_global: params.useGlobal,
      ...(params.apiUrl !== undefined ? { api_url: params.apiUrl } : {}),
      ...(params.apiKey !== undefined ? { api_key: params.apiKey } : {}),
    });
    return extractData<WahaResponse>(response);
  },

  async deleteSession(params: { session: string; apiUrl?: string; apiKey?: string }) {
    const response = await api.delete('/waha/authorization/delete_session', {
      data: {
        session: params.session,
        ...(params.apiUrl !== undefined ? { api_url: params.apiUrl } : {}),
        ...(params.apiKey !== undefined ? { api_key: params.apiKey } : {}),
      },
    });
    return extractData<WahaResponse>(response);
  },
};

export default WahaService;

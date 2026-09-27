import api from '@/services/core/api';
import { extractData } from '@/utils/apiHelpers';
import type { ScheduledAction, CreateScheduledAction } from '@/types/automation';

class ScheduledActionsService {
  async list(params?: Record<string, any>): Promise<ScheduledAction[]> {
    const response = await api.get('/scheduled_actions', { params });
    return extractData<any>(response);
  }

  async get(id: string): Promise<ScheduledAction> {
    const response = await api.get(`/scheduled_actions/${id}`);
    return extractData<any>(response);
  }

  async create(payload: CreateScheduledAction, files: File[] = []): Promise<ScheduledAction> {
    if (files.length === 0) {
      const response = await api.post('/scheduled_actions', {
        scheduled_action: payload,
      });
      return extractData<ScheduledAction>(response);
    }

    // With attachments the request must be multipart: build the nested
    // `scheduled_action[...]` fields by hand so Rails nests them correctly.
    const formData = new FormData();
    formData.append('scheduled_action[action_type]', payload.action_type);
    formData.append('scheduled_action[scheduled_for]', payload.scheduled_for);
    if (payload.conversation_id) formData.append('scheduled_action[conversation_id]', payload.conversation_id);
    if (payload.contact_id) formData.append('scheduled_action[contact_id]', payload.contact_id);
    if (payload.deal_id) formData.append('scheduled_action[deal_id]', payload.deal_id);
    if (payload.recurrence_type) formData.append('scheduled_action[recurrence_type]', payload.recurrence_type);

    Object.entries(payload.payload || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(`scheduled_action[payload][${key}]`, String(value));
      }
    });

    files.forEach(file => formData.append('scheduled_action[attachments][]', file));

    const response = await api.post('/scheduled_actions', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return extractData<ScheduledAction>(response);
  }

  async update(id: string, payload: Partial<CreateScheduledAction>): Promise<ScheduledAction> {
    const response = await api.patch(`/scheduled_actions/${id}`, {
      scheduled_action: payload,
    });
    return extractData<any>(response);
  }

  async cancel(id: string): Promise<void> {
    await api.delete(`/scheduled_actions/${id}`);
  }

  async listByContact(contactId: string, params?: Record<string, any>): Promise<ScheduledAction[]> {
    const response = await api.get(`/scheduled_actions/by_contact/${contactId}`, {
      params,
    });
    return extractData<any>(response);
  }

  async listByDeal(dealId: string, params?: Record<string, any>): Promise<ScheduledAction[]> {
    const response = await api.get(`/scheduled_actions/by_deal/${dealId}`, {
      params,
    });
    return extractData<any>(response);
  }
}

export const scheduledActionsService = new ScheduledActionsService();

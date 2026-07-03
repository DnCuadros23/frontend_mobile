/** Endpoints de casos. */
import api from './client';
import type {
  Case,
  CaseStatus,
  DashboardStats,
  Page,
  Priority,
} from '../types';

export interface ListCasesParams {
  estado?: CaseStatus;
  page?: number;
  size?: number;
}

export interface CreateCaseBody {
  title: string;
  description?: string;
  priority: Priority;
  victimId: number;
  // Optional geolocation captured at report time (e.g. SOS / incident report).
  latitude?: number;
  longitude?: number;
}

export const casesApi = {
  list(params: ListCasesParams = {}) {
    return api
      .get<Page<Case>>('/api/cases', { params })
      .then((r) => r.data);
  },

  get(id: number) {
    return api.get<Case>(`/api/cases/${id}`).then((r) => r.data);
  },

  create(body: CreateCaseBody) {
    return api.post<Case>('/api/cases', body).then((r) => r.data);
  },

  update(id: number, body: Partial<CreateCaseBody>) {
    return api.put<Case>(`/api/cases/${id}`, body).then((r) => r.data);
  },

  updatePriority(id: number, priority: Priority, requesterId: number) {
    return api
      .patch<Case>(`/api/cases/${id}/priority`, { priority, requesterId })
      .then((r) => r.data);
  },

  remove(id: number) {
    return api.delete(`/api/cases/${id}`).then((r) => r.data);
  },

  /** Endpoint optimizado de estadísticas para el dashboard. */
  statistics() {
    return api
      .get<DashboardStats>('/api/cases/statistics')
      .then((r) => r.data);
  },
};

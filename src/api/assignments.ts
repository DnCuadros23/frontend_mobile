import api from './client';
import type { Assignment } from '../types';

export interface CreateAssignmentDto {
  caseId: number;
  specialistId: number;
  assignedById: number;
}

export const assignmentsApi = {
  byCase(caseId: number): Promise<Assignment[]> {
    return api
      .get<Assignment[]>(`/api/assignments/case/${caseId}`)
      .then((r) => (Array.isArray(r.data) ? r.data : []));
  },
  create(dto: CreateAssignmentDto): Promise<Assignment> {
    return api.post<Assignment>('/api/assignments', dto).then((r) => r.data);
  },
  deactivate(id: number): Promise<Assignment> {
    return api
      .patch<Assignment>(`/api/assignments/${id}/deactivate`)
      .then((r) => r.data);
  },
};

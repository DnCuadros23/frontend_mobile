import api from './client';
import type { Message } from '../types';

export interface CreateMessageDto {
  caseId: number;
  authorId: number;
  content: string;
}

export const messagesApi = {
  byCase(caseId: number): Promise<Message[]> {
    return api
      .get<Message[]>(`/api/messages/case/${caseId}`)
      .then((r) => (Array.isArray(r.data) ? r.data : []));
  },
  create(dto: CreateMessageDto): Promise<Message> {
    return api.post<Message>('/api/messages', dto).then((r) => r.data);
  },
  update(id: number, content: string): Promise<Message> {
    return api.put<Message>(`/api/messages/${id}`, { content }).then((r) => r.data);
  },
  remove(id: number): Promise<void> {
    return api.delete(`/api/messages/${id}`).then(() => undefined);
  },
};

import api from './client';

export type AssistantRole = 'user' | 'assistant';

export interface AssistantMessageDto {
  role: AssistantRole;
  content: string;
}

export interface AssistantChatRequest {
  messages: AssistantMessageDto[];
}

export interface AssistantChatResponse {
  reply: string;
}

export const assistantApi = {
  chat(body: AssistantChatRequest): Promise<AssistantChatResponse> {
    return api
      .post<AssistantChatResponse>('/api/assistant/chat', body)
      .then((response) => response.data);
  },
};
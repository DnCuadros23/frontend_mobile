import api from './client';
import type {
  CreateEvidenceRequest,
  Evidence,
  PresignedUrlRequest,
  PresignedUrlResponse,
} from '../types';

export const evidenceApi = {
  byCase(caseId: number) {
    return api
      .get<Evidence[]>(`/api/evidence/case/${caseId}`)
      .then((response) => response.data);
  },

  requestPresignedUrl(body: PresignedUrlRequest) {
    return api
      .post<PresignedUrlResponse>('/api/evidence/presigned-url', body)
      .then((response) => response.data);
  },

  async uploadFileToS3(
    presignedUrl: string,
    fileUri: string,
    contentType: string,
  ) {
    const fileResponse = await fetch(fileUri);
    const blob = await fileResponse.blob();

    const uploadResponse = await fetch(presignedUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': contentType,
      },
      body: blob,
    });

    if (!uploadResponse.ok) {
      throw new Error('No se pudo subir el archivo a S3.');
    }
  },

  create(body: CreateEvidenceRequest) {
    return api
      .post<Evidence>('/api/evidence', body)
      .then((response) => response.data);
  },

  remove(evidenceId: number) {
    return api
      .delete(`/api/evidence/${evidenceId}`)
      .then((response) => response.data);
  },
};

export const getEvidenceByCase = evidenceApi.byCase;
export const requestPresignedUrl = evidenceApi.requestPresignedUrl;
export const uploadFileToS3 = evidenceApi.uploadFileToS3;
export const createEvidence = evidenceApi.create;
export const deleteEvidence = evidenceApi.remove;
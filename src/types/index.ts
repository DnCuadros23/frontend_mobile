

export type Role = 'VICTIM' | 'SPECIALIST' | 'ADMIN';

export type CaseStatus = 'OPEN' | 'UNDER_INVESTIGATION' | 'CLOSED' | 'ARCHIVED';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type EvidenceType = 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'AUDIO' | 'OTHER';

export interface User {
  id: number;
  email: string;
  name: string;
  phone?: string | null;
  alias?: string | null;
  role: Role;
  createdAt?: string;
}

export interface Case {
  id: number;
  title: string;
  description?: string | null;
  status: CaseStatus;
  priority: Priority;
  victimId?: number;
  // Approximate incident location (optional — only present for geotagged cases).
  latitude?: number | null;
  longitude?: number | null;
  createdAt: string;
  updatedAt?: string;
}

export interface Evidence {
  id: number;
  caseId?: number;
  uploadedById?: number;
  type: EvidenceType;
  originalName: string;
  fileUrl: string;
  fileKey?: string | null;
  sizeBytes: number;
  description?: string | null;
  createdAt?: string;
}

export interface Message {
  id: number;
  caseId: number;
  authorId: number;
  authorName?: string;
  content: string;
  createdAt: string;
}

export interface Assignment {
  id: number;
  caseId: number;
  specialistId: number;
  specialistName?: string;
  assignedById: number;
  assignedAt: string;
  active: boolean;
}

// ---- Auth ----

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
  alias?: string;
  role: Role;
}

/** Respuesta de /api/auth/login y /api/auth/refresh. El backend usa `accessToken`. */
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface UpdateProfileRequest {
  name: string;
  phone?: string;
  alias?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// ---- Paginación (Spring Data Page<T>) ----

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

// ---- Dashboard ----

/** Respuesta de GET /api/cases/statistics (DashboardStatsDTO del backend). */
export interface DashboardStats {
  totalCases: number;
  byStatus: Record<CaseStatus, number>;
  byPriority: Record<Priority, number>;
}
export interface PresignedUrlRequest {
  originalName: string;
  contentType: string;
}

export interface PresignedUrlResponse {
  presignedUrl: string;
  fileKey: string;
  fileUrl: string;
  method?: string;
  expiresAt?: string;
}

export interface CreateEvidenceRequest {
  caseId: number;
  uploadedById: number;
  type: EvidenceType;
  originalName: string;
  fileUrl: string;
  fileKey?: string;
  sizeBytes: number;
  description?: string;
}
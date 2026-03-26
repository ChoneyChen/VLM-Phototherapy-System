import type {
  AppLanguage,
  AssessmentDetail,
  AssessmentListItem,
  Provider,
  TreatmentControlOptions,
  TreatmentControlSession,
  User
} from "../types";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000/api";
const FILE_BASE = `${API_BASE.replace(/\/api$/, "")}/files`;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, init);
  if (!response.ok) {
    const body = await response.json().catch(() => ({ detail: "Request failed." }));
    throw new Error(body.detail ?? "Request failed.");
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

export function buildImageUrl(relativePath: string): string {
  return `${FILE_BASE}/${relativePath}`;
}

export function listUsers(): Promise<User[]> {
  return request<User[]>("/users");
}

export function createUser(payload: { name: string; notes?: string }): Promise<User> {
  return request<User>("/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

export function deleteUser(userPublicId: string): Promise<void> {
  return request<void>(`/users/${userPublicId}`, {
    method: "DELETE"
  });
}

export function listAssessments(userPublicId: string): Promise<AssessmentListItem[]> {
  return request<AssessmentListItem[]>(`/users/${userPublicId}/assessments`);
}

export function getAssessment(assessmentId: string): Promise<AssessmentDetail> {
  return request<AssessmentDetail>(`/assessments/${assessmentId}`);
}

export function deleteAssessment(assessmentId: string): Promise<void> {
  return request<void>(`/assessments/${assessmentId}`, {
    method: "DELETE"
  });
}

export function getTreatmentControlOptions(): Promise<TreatmentControlOptions> {
  return request<TreatmentControlOptions>("/treatment-control/options");
}

export function createTreatmentControlPreset(payload: {
  assessmentId: string;
  zoneName: string;
}): Promise<TreatmentControlSession> {
  return request<TreatmentControlSession>("/treatment-control/preset", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      assessment_id: payload.assessmentId,
      zone_name: payload.zoneName
    })
  });
}

export async function createAssessment(payload: {
  userPublicId: string;
  provider: Provider;
  language: AppLanguage;
  clinicianNotes?: string;
  image: File;
}): Promise<AssessmentDetail> {
  const formData = new FormData();
  formData.append("user_public_id", payload.userPublicId);
  formData.append("model_provider", payload.provider);
  formData.append("analysis_language", payload.language);
  formData.append("image", payload.image);
  if (payload.clinicianNotes) {
    formData.append("clinician_notes", payload.clinicianNotes);
  }

  const response = await fetch(`${API_BASE}/assessments`, {
    method: "POST",
    body: formData
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({ detail: "Assessment failed." }));
    throw new Error(body.detail ?? "Assessment failed.");
  }
  return response.json() as Promise<AssessmentDetail>;
}

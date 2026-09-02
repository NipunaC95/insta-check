import { UploadSession, DashboardStats, UploadResponse } from '../types/index.ts';

export async function fetchUploads(): Promise<UploadSession[]> {
  const res = await fetch('/api/uploads');
  if (!res.ok) {
    throw new Error(`Failed to load sessions: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchDashboard(uploadId: number, compareWithId?: number | null): Promise<DashboardStats> {
  const url = compareWithId
    ? `/api/dashboard/${uploadId}?compareWithId=${compareWithId}`
    : `/api/dashboard/${uploadId}`;
  const res = await fetch(url);
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.error || `Failed to fetch dashboard data (${res.status})`);
  }
  return res.json();
}

export async function deleteUploadSession(uploadId: number): Promise<void> {
  const res = await fetch(`/api/uploads/${uploadId}`, { method: 'DELETE' });
  if (!res.ok) {
    const errData = await res.json().catch(() => null);
    throw new Error(errData?.error || 'Failed to delete session');
  }
}

export async function createDemoSessions(): Promise<{
  previousUploadId: number;
  currentUploadId: number;
  message: string;
}> {
  const res = await fetch('/api/demo', { method: 'POST' });
  if (!res.ok) {
    const errData = await res.json().catch(() => null);
    throw new Error(errData?.error || 'Failed to generate demo sessions');
  }
  return res.json();
}

export async function uploadExportFiles(formData: FormData): Promise<UploadResponse> {
  const res = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Upload failed');
  }
  return data;
}

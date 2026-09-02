import { UploadSession, DashboardStats, UploadResponse } from '../types/index.ts';

/**
 * Robust JSON fetch wrapper that guards against HTML error pages or SPA fallback responses.
 * Prevents "Unexpected token '<', "<!doctype "..." syntax errors on the client.
 */
async function safeFetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, options);
  } catch (networkErr: any) {
    throw new Error(`Network connection failed: ${networkErr.message || 'Unable to connect to server.'}`);
  }

  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.toLowerCase().includes('application/json');

  if (!isJson) {
    const rawText = await res.text().catch(() => '');
    const trimmed = rawText.trim();

    // Check if the server or reverse-proxy returned an HTML document (e.g. 404, 502, 504, or SPA fallback)
    if (trimmed.startsWith('<') || trimmed.toLowerCase().includes('<!doctype')) {
      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status} (${res.statusText || 'Error'}). Please try again.`);
      }
      throw new Error(`API endpoint "${url}" returned an HTML page instead of JSON data. Please verify the server is running.`);
    }

    if (!res.ok) {
      throw new Error(trimmed || `Request failed with HTTP status ${res.status}`);
    }

    try {
      return JSON.parse(trimmed) as T;
    } catch {
      throw new Error(`Server returned a non-JSON response from ${url}`);
    }
  }

  let data: any;
  try {
    data = await res.json();
  } catch (parseErr: any) {
    throw new Error(`Could not parse JSON response from server: ${parseErr.message}`);
  }

  if (!res.ok) {
    throw new Error(data?.error || `Request to ${url} failed with status ${res.status}`);
  }

  return data as T;
}

export async function fetchUploads(): Promise<UploadSession[]> {
  return safeFetchJson<UploadSession[]>('/api/uploads');
}

export async function fetchDashboard(uploadId: number, compareWithId?: number | null): Promise<DashboardStats> {
  if (!uploadId || isNaN(uploadId)) {
    throw new Error('Valid upload session ID is required to fetch insights.');
  }

  const url = compareWithId && !isNaN(compareWithId)
    ? `/api/dashboard/${uploadId}?compareWithId=${compareWithId}`
    : `/api/dashboard/${uploadId}`;

  return safeFetchJson<DashboardStats>(url);
}

export async function deleteUploadSession(uploadId: number): Promise<void> {
  await safeFetchJson<{ success: boolean }>(`/api/uploads/${uploadId}`, { method: 'DELETE' });
}

export async function createDemoSessions(): Promise<{
  previousUploadId: number;
  currentUploadId: number;
  message: string;
}> {
  return safeFetchJson<{
    previousUploadId: number;
    currentUploadId: number;
    message: string;
  }>('/api/demo', { method: 'POST' });
}

export async function uploadExportFiles(formData: FormData): Promise<UploadResponse> {
  return safeFetchJson<UploadResponse>('/api/upload', {
    method: 'POST',
    body: formData,
  });
}

export async function fetchUnfollowedUsers(): Promise<string[]> {
  const data = await safeFetchJson<{ unfollowed: string[] }>('/api/unfollowed');
  return data.unfollowed || [];
}

export async function toggleUnfollowedUserApi(username: string): Promise<{ username: string; unfollowed: boolean }> {
  return safeFetchJson<{ success: boolean; username: string; unfollowed: boolean }>('/api/unfollowed/toggle', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username }),
  });
}



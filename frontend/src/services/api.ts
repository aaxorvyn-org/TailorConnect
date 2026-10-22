import { appConfig } from '../utils/env';

export interface ApiErrorResponse {
  detail?: string | Array<{ msg: string; loc: string[] }>;
  message?: string;
}

/**
 * Base API client with Bearer auth token injection, timeout, and structured error extraction
 */
export async function apiClient<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  // Strip duplicate slashes
  const baseUrl = appConfig.apiBaseUrl.replace(/\/+$/, '');
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${cleanEndpoint}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  // Automatically attach JWT token from localStorage if available
  const token = localStorage.getItem('threadcraft_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Merge any caller-provided headers
  if (options.headers) {
    Object.assign(headers, options.headers);
  }

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers,
    });

    clearTimeout(timeoutId);

    // If 401 Unauthorized occurs on an authenticated route, clear stored session
    if (response.status === 401 && !endpoint.includes('/auth/login')) {
      localStorage.removeItem('threadcraft_token');
      localStorage.removeItem('threadcraft_user');
    }

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = (await response.json()) as ApiErrorResponse;
        if (typeof errorData.detail === 'string') {
          errorMessage = errorData.detail;
        } else if (Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail.map((d) => d.msg).join(', ');
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch {
        const rawText = await response.text().catch(() => '');
        if (rawText) errorMessage = rawText;
      }
      throw new Error(errorMessage);
    }

    // For 204 No Content or empty responses
    if (response.status === 204) {
      return {} as T;
    }

    return (await response.json()) as T;
  } catch (error: unknown) {
    clearTimeout(timeoutId);
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error(`Request timed out connecting to backend server (${url})`);
      }
      throw error;
    }
    throw new Error(String(error));
  }
}

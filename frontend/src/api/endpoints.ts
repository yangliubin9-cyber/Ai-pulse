import { apiRequest } from './client';
import type {
  Category,
  DailyResponse,
  IngestResult,
  Item,
  ItemsQuery,
  Paginated,
  Source,
  Stats,
  User,
} from '@/lib/types';

export const itemsApi = {
  list(params: ItemsQuery, signal?: AbortSignal): Promise<Paginated<Item>> {
    return apiRequest<Paginated<Item>>('/items', {
      query: {
        category: params.category,
        source_type: params.source_type,
        featured: params.featured,
        page: params.page,
        page_size: params.page_size,
      },
      signal,
    });
  },
  detail(id: string, signal?: AbortSignal): Promise<Item> {
    return apiRequest<Item>(`/items/${encodeURIComponent(id)}`, { signal });
  },
};

export const catalogApi = {
  categories(signal?: AbortSignal): Promise<Category[]> {
    return apiRequest<Category[]>('/categories', { signal });
  },
  sources(signal?: AbortSignal): Promise<Source[]> {
    return apiRequest<Source[]>('/sources', { signal });
  },
  stats(signal?: AbortSignal): Promise<Stats> {
    return apiRequest<Stats>('/stats', { signal });
  },
  daily(date: string | undefined, signal?: AbortSignal): Promise<DailyResponse> {
    return apiRequest<DailyResponse>('/daily', {
      query: { date },
      signal,
    });
  },
};

export const ingestApi = {
  run(): Promise<IngestResult> {
    return apiRequest<IngestResult>('/ingest/run', { method: 'POST' });
  },
};

export const authApi = {
  login(email: string, password: string): Promise<{ user: User }> {
    return apiRequest<{ user: User }>('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
  },
  logout(): Promise<void> {
    return apiRequest<void>('/auth/logout', { method: 'POST' });
  },
  me(signal?: AbortSignal): Promise<User> {
    return apiRequest<User>('/auth/me', { signal });
  },
  changePassword(oldPassword: string, newPassword: string): Promise<void> {
    return apiRequest<void>('/auth/change-password', {
      method: 'POST',
      body: { old_password: oldPassword, new_password: newPassword },
    });
  },
};

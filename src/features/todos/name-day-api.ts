import { apiClient } from '@/lib/api/api-client';
import type { components } from '@/lib/api/generated';
import type { NameDay } from './name-day';

/** Loads customary Polish name days used by the Todo Plus calendar. */
export class NameDayApi {
  async list(year: number): Promise<NameDay[]> {
    const result = await apiClient.request<components['schemas']['NameDayListResponseDto']>(`/todos/name-days?year=${year}`);
    return result.items;
  }
}

export const nameDayApi = new NameDayApi();

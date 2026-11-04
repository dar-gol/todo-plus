import { apiClient } from '@/lib/api/api-client';
import type { components } from '@/lib/api/generated';
import type { PublicHoliday } from './public-holiday';

/** Loads read-only public holidays used by the Todo Plus calendar. */
export class PublicHolidayApi {
  async list(year: number): Promise<PublicHoliday[]> {
    const result = await apiClient.request<components['schemas']['PublicHolidayListResponseDto']>(`/todos/holidays?year=${year}`);
    return result.items;
  }
}

export const publicHolidayApi = new PublicHolidayApi();

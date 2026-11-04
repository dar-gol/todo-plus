import { apiClient } from '@/lib/api/api-client';
import type { components } from '@/lib/api/generated';
import type { ChristianHoliday } from './christian-holiday';

/** Loads major Christian celebrations used by the Todo Plus calendar. */
export class ChristianHolidayApi {
  async list(year: number): Promise<ChristianHoliday[]> {
    const result = await apiClient.request<components['schemas']['ChristianHolidayListResponseDto']>(`/todos/christian-holidays?year=${year}`);
    return result.items;
  }
}

export const christianHolidayApi = new ChristianHolidayApi();

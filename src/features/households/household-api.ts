import type { components } from '@/lib/api/generated';
import { apiClient } from '@/lib/api/api-client';

/** Reads the Kitchen Plus household shared with Todo Plus. */
export class HouseholdApi {
  current(): Promise<components['schemas']['HouseholdResponseDto'] | null> {
    return apiClient.request('/households/me');
  }
}

export const householdApi = new HouseholdApi();

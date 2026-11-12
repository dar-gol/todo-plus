import type { components, operations } from '../../lib/api/generated';
import { apiClient } from '../../lib/api/api-client';

export type ShoppingListItem = components['schemas']['ShoppingListItemResponseDto'];
export type CreateShoppingListItem = components['schemas']['CreateShoppingListItemDto'];
export type UpdateShoppingListItem = components['schemas']['UpdateShoppingListItemDto'];
export type DeleteShoppingListItem = components['schemas']['DeleteShoppingListItemDto'];
type ShoppingListResponse = components['schemas']['ShoppingListResponseDto'];
type ShoppingListPath = operations['ShoppingListController_list']['parameters']['path'];

/** Uses the shared Kitchen Plus household shopping-list contract. */
export class ShoppingListApi {
  async list(householdId: ShoppingListPath['id']): Promise<ShoppingListItem[]> {
    const result = await apiClient.request<ShoppingListResponse>(this.itemsPath(householdId));
    return result.items.filter((item) => !item.deletedAt && !item.completedAt);
  }

  add(householdId: string, input: CreateShoppingListItem): Promise<ShoppingListItem> {
    return apiClient.request(this.itemsPath(householdId), {
      method: 'POST',
      body: JSON.stringify(input)
    });
  }

  update(householdId: string, itemId: string, input: UpdateShoppingListItem): Promise<ShoppingListItem> {
    return apiClient.request(`${this.itemsPath(householdId)}/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify(input)
    });
  }

  remove(householdId: string, itemId: string, input: DeleteShoppingListItem): Promise<ShoppingListItem> {
    return apiClient.request(`${this.itemsPath(householdId)}/${itemId}`, {
      method: 'DELETE',
      body: JSON.stringify(input)
    });
  }

  private itemsPath(householdId: string) {
    return `/households/${encodeURIComponent(householdId)}/shopping-list/items`;
  }
}

export const shoppingListApi = new ShoppingListApi();

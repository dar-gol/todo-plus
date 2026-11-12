// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TodoShoppingList } from './todo-shopping-list';
import { shoppingListApi, type ShoppingListItem } from './shopping-list-api';

vi.mock('./shopping-list-api', () => ({
  shoppingListApi: {
    add: vi.fn(),
    list: vi.fn(),
    remove: vi.fn(),
    update: vi.fn()
  }
}));

const milk: ShoppingListItem = {
  checkedAt: null,
  completedAt: null,
  createdAt: '2026-11-12T12:00:00.000Z',
  deletedAt: null,
  id: 'item-1',
  label: 'Mleko',
  productId: null,
  quantity: 2,
  unit: 'pcs',
  updatedAt: '2026-11-12T12:00:00.000Z',
  version: 1
};

function renderShoppingList() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <TodoShoppingList householdId="household-1" householdName="Rodzina" />
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.mocked(shoppingListApi.list).mockResolvedValue([milk]);
  vi.mocked(shoppingListApi.add).mockResolvedValue(milk);
  vi.mocked(shoppingListApi.update).mockResolvedValue({ ...milk, checkedAt: '2026-11-12T12:10:00.000Z', version: 2 });
  vi.mocked(shoppingListApi.remove).mockResolvedValue({ ...milk, deletedAt: '2026-11-12T12:10:00.000Z', version: 2 });
  vi.spyOn(globalThis.crypto, 'randomUUID').mockReturnValue('00000000-0000-4000-8000-000000000001');
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('TodoShoppingList', () => {
  it('adds an item directly to the shared Kitchen Plus shopping list', async () => {
    renderShoppingList();
    await screen.findByText('Mleko');
    expect(screen.getByRole('link', { name: 'Otwórz listę w Kitchen Plus' }).getAttribute('href')).toBe('http://localhost:3001/pl/shopping');

    fireEvent.change(screen.getByLabelText('Nazwa produktu'), { target: { value: 'Chleb' } });
    fireEvent.click(screen.getByRole('button', { name: 'Dodaj' }));

    await waitFor(() => expect(shoppingListApi.add).toHaveBeenCalledWith('household-1', {
      label: 'Chleb',
      mutationId: '00000000-0000-4000-8000-000000000001',
      quantity: 1,
      unit: 'pcs'
    }));
  });

  it('keeps the item interactive after checking so it can be unchecked again', async () => {
    const checkedMilk = { ...milk, checkedAt: '2026-11-12T12:10:00.000Z', version: 2 };
    vi.mocked(shoppingListApi.list)
      .mockResolvedValueOnce([milk])
      .mockResolvedValue([checkedMilk]);
    renderShoppingList();

    const checkButton = await screen.findByRole('button', { name: 'Oznacz Mleko jako kupione' });
    fireEvent.click(checkButton);

    await waitFor(() => expect(shoppingListApi.update).toHaveBeenCalledWith('household-1', 'item-1', {
      checked: true,
      mutationId: '00000000-0000-4000-8000-000000000001',
      version: 1
    }));
    const uncheckButton = await screen.findByRole('button', { name: 'Odznacz Mleko' });
    await waitFor(() => expect((uncheckButton as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(uncheckButton);

    await waitFor(() => expect(shoppingListApi.update).toHaveBeenLastCalledWith('household-1', 'item-1', {
      checked: false,
      mutationId: '00000000-0000-4000-8000-000000000001',
      version: 2
    }));
  });
});

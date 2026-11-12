'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, CookingPot, Plus, RefreshCw, ShoppingBasket, Trash2 } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { shoppingListApi, type ShoppingListItem } from './shopping-list-api';

const shoppingListQueryKey = (householdId: string) => ['shopping-list', householdId] as const;
const kitchenPlusShoppingUrl = process.env.NEXT_PUBLIC_KITCHEN_PLUS_URL ?? 'http://localhost:3001/pl/shopping';

function createMutationId() {
  return crypto.randomUUID();
}

function quantityLabel(item: ShoppingListItem) {
  const unit = item.unit === 'pcs' ? 'szt.' : item.unit;
  return `${item.quantity} ${unit}`;
}

/** Presents the Kitchen Plus shopping list inside Todo Plus without duplicating its state. */
export function TodoShoppingList({ householdId, householdName }: { householdId: string; householdName: string }) {
  const [label, setLabel] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState<ShoppingListItem['unit']>('pcs');
  const queryClient = useQueryClient();
  const queryKey = shoppingListQueryKey(householdId);
  const shoppingList = useQuery({
    queryKey,
    queryFn: () => shoppingListApi.list(householdId)
  });
  const addItem = useMutation({
    mutationFn: () => shoppingListApi.add(householdId, {
      label: label.trim(),
      quantity: Number(quantity),
      unit,
      mutationId: createMutationId()
    }),
    onSuccess: async () => {
      setLabel('');
      setQuantity('1');
      await queryClient.invalidateQueries({ queryKey });
    }
  });
  const toggleItem = useMutation({
    mutationFn: (item: ShoppingListItem) => shoppingListApi.update(householdId, item.id, {
      checked: !item.checkedAt,
      version: item.version,
      mutationId: createMutationId()
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey })
  });
  const removeItem = useMutation({
    mutationFn: (item: ShoppingListItem) => shoppingListApi.remove(householdId, item.id, {
      version: item.version,
      mutationId: createMutationId()
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey })
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!label.trim() || Number(quantity) <= 0 || addItem.isPending) return;
    addItem.mutate();
  }

  const pendingItemId = toggleItem.isPending
    ? toggleItem.variables?.id
    : removeItem.isPending
      ? removeItem.variables?.id
      : undefined;
  const mutationError = addItem.error ?? toggleItem.error ?? removeItem.error;

  return (
    <section className="shopping-section" aria-labelledby="shopping-title">
      <div className="section-heading">
        <div><p className="eyebrow">WSPÓLNA Z KITCHEN PLUS</p><h1 id="shopping-title">Lista zakupów</h1></div>
        <span className="task-count">{shoppingList.data?.length ?? 0}</span>
      </div>
      <p className="shopping-sync-copy">Zmiany są od razu widoczne dla domowników w domu „{householdName}”.</p>
      <a className="kitchen-plus-link" href={kitchenPlusShoppingUrl}><CookingPot aria-hidden="true" />Otwórz listę w Kitchen Plus</a>

      <form className="shopping-add-form" onSubmit={submit}>
        <label className="shopping-name-field">
          <span>Co kupić?</span>
          <input
            aria-label="Nazwa produktu"
            autoComplete="off"
            maxLength={200}
            onChange={(event) => setLabel(event.target.value)}
            placeholder="np. mleko"
            value={label}
          />
        </label>
        <label>
          <span>Ilość</span>
          <input aria-label="Ilość" min="0.01" onChange={(event) => setQuantity(event.target.value)} step="0.01" type="number" value={quantity} />
        </label>
        <label>
          <span>Jednostka</span>
          <select aria-label="Jednostka" onChange={(event) => setUnit(event.target.value as ShoppingListItem['unit'])} value={unit}>
            <option value="pcs">szt.</option>
            <option value="g">g</option>
            <option value="ml">ml</option>
          </select>
        </label>
        <button className="shopping-add-button" disabled={addItem.isPending || !label.trim()} type="submit">
          {addItem.isPending ? <RefreshCw className="spin" aria-hidden="true" /> : <Plus aria-hidden="true" />}
          {addItem.isPending ? 'Dodaję…' : 'Dodaj'}
        </button>
      </form>

      {mutationError ? <p className="shopping-error" role="alert">{mutationError.message}</p> : null}
      {shoppingList.isLoading ? <div className="state-card"><RefreshCw className="spin" aria-hidden="true" />Wczytuję zakupy…</div> : null}
      {shoppingList.isError ? <div className="state-card error-state"><p>{shoppingList.error.message}</p><button onClick={() => shoppingList.refetch()}>Spróbuj ponownie</button></div> : null}
      {!shoppingList.isLoading && !shoppingList.isError && shoppingList.data?.length === 0 ? (
        <div className="empty-state shopping-empty"><ShoppingBasket aria-hidden="true" /><h2>Lista zakupów jest pusta</h2><p>Dodaj pierwszą rzecz — pojawi się także w Kitchen Plus.</p></div>
      ) : null}
      {shoppingList.data?.length ? (
        <ul className="shopping-list">
          {shoppingList.data.map((item) => {
            const checked = Boolean(item.checkedAt);
            const pending = pendingItemId === item.id;
            return (
              <li className={checked ? 'checked' : ''} key={item.id}>
                <button
                  aria-label={checked ? `Odznacz ${item.label}` : `Oznacz ${item.label} jako kupione`}
                  className="shopping-check-button"
                  disabled={pending}
                  onClick={() => toggleItem.mutate(item)}
                  type="button"
                >{checked ? <Check aria-hidden="true" /> : null}</button>
                <button className="shopping-item-copy" disabled={pending} onClick={() => toggleItem.mutate(item)} type="button">
                  <strong>{item.label}</strong><span>{quantityLabel(item)}</span>
                </button>
                <button aria-label={`Usuń ${item.label}`} className="shopping-remove-button" disabled={pending} onClick={() => removeItem.mutate(item)} type="button"><Trash2 aria-hidden="true" /></button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}

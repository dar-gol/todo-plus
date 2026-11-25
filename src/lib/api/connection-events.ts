export const connectionStateEventName = 'todo-plus:connection-state';

export function reportApiConnection(online: boolean): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(connectionStateEventName, { detail: online }));
}

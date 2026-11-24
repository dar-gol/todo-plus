const maxTodoNoteLinkLength = 2_048;

export function normalizeTodoNoteLinkHref(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const href = value.trim();
  if (!href || href.length > maxTodoNoteLinkLength) return null;

  try {
    const url = new URL(href);
    if ((url.protocol !== 'http:' && url.protocol !== 'https:') || url.username || url.password) return null;
    return url.href;
  } catch {
    return null;
  }
}

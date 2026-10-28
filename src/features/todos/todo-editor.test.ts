import { describe, expect, it } from 'vitest';
import { dateAtNine } from './todo-editor';

describe('dateAtNine', () => {
  it('schedules a date-only reminder at 09:00 in the browser time zone', () => {
    const result = new Date(dateAtNine('2026-11-05'));
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(10);
    expect(result.getDate()).toBe(5);
    expect(result.getHours()).toBe(9);
  });
});

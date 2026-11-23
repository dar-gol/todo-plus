import { describe, expect, it } from 'vitest';
import { dateTimeAtIso, dateTimeInputValue, dueDateTimeInputValue } from './todo-date';

describe('due date and time', () => {
  it('adds a comfortable default hour to a date selected from the calendar', () => {
    expect(dueDateTimeInputValue('2026-11-05')).toBe('2026-11-05T09:00');
  });
});

describe('reminder date and time', () => {
  it('round-trips a local date-time input without changing the local wall time', () => {
    const localValue = '2026-11-05T18:30';
    expect(dateTimeInputValue(dateTimeAtIso(localValue))).toBe(localValue);
  });
});

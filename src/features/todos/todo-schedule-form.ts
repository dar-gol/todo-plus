import type { todoApi } from './todo-api';
import { dateTimeAtIso } from './todo-date';

/** Reads and validates the scheduling fields shared by task creation and editing. */
export function readTodoScheduleForm(data: FormData): Pick<Parameters<typeof todoApi.create>[0],
  'dueAt' | 'endAt' | 'dueAtAlarmEnabled' | 'recurrence' | 'reminders' | 'alarmReminders'> {
  const dueAt = readDateTime(data.get('dueAt'));
  const endAt = readDateTime(data.get('endAt'));
  const recurrence = data.get('recurrence');
  const interval = recurrence === 'daily' || recurrence === 'weekly'
    || recurrence === 'monthly' || recurrence === 'yearly' ? recurrence : null;

  if (interval && !dueAt) throw new Error('Wybierz termin, aby zadanie mogło się powtarzać.');
  if (endAt && (!dueAt || new Date(endAt) < new Date(dueAt))) {
    throw new Error('Koniec musi przypadać w tym samym czasie co start albo później.');
  }

  return {
    dueAt,
    endAt,
    dueAtAlarmEnabled: false,
    recurrence: interval,
    reminders: data.getAll('reminders').map((value) => dateTimeAtIso(String(value))),
    alarmReminders: []
  };
}

function readDateTime(value: FormDataEntryValue | null): string | null {
  return typeof value === 'string' && value ? dateTimeAtIso(value) : null;
}

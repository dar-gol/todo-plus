import { AlarmClock, AlarmClockOff } from 'lucide-react';

/** Renders the same accessible, form-backed icon toggle for deadlines and reminders. */
export function TodoAlarmToggle({ label, name, value, checked, disabled, onChange }: {
  label: string;
  name: string;
  value?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
}) {
  return (
    <label className="todo-alarm-toggle" title={checked ? 'Wyłącz alarm' : 'Włącz alarm'}>
      <input type="checkbox" aria-label={label} name={name} value={value} checked={checked} disabled={disabled} onChange={onChange} />
      <span>{checked ? <AlarmClock aria-hidden="true" /> : <AlarmClockOff aria-hidden="true" />}</span>
    </label>
  );
}

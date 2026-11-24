'use client';

import type { ChangeEventHandler } from 'react';

/** Keeps the native date-time picker within its mobile form boundary without padding the WebKit control itself. */
export function TodoDateTimeInput({
  ariaLabel,
  id,
  name,
  onChange,
  required = false,
  value
}: {
  ariaLabel: string;
  id?: string;
  name: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  required?: boolean;
  value: string;
}) {
  return (
    <span className="date-time-control">
      <input
        aria-label={ariaLabel}
        id={id}
        name={name}
        type="datetime-local"
        value={value}
        required={required}
        onChange={onChange}
      />
    </span>
  );
}

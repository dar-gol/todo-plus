'use client';

import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { todoQuickAddPath } from './todo-quick-add-path';

export function TodoShortcutSettings() {
  const [message, setMessage] = useState('');
  const [manualAddress, setManualAddress] = useState('');

  async function copyAddress() {
    const url = new URL(todoQuickAddPath, window.location.origin).href;
    try {
      await navigator.clipboard.writeText(url);
      setManualAddress('');
      setMessage('Skopiowano adres.');
    } catch {
      setManualAddress(url);
      setMessage('Zaznacz i skopiuj adres poniżej.');
    }
  }

  return (
    <details className="task-more-fields todo-shortcut-settings">
      <summary><span><strong>Skróty na telefonie</strong><small>Szybkie otwieranie formularza</small></span><ChevronDown aria-hidden="true" /></summary>
      <div className="task-more-content todo-shortcut-instructions">
        <p><strong>Android.</strong> Zainstaluj Todo Plus w Chrome. Przytrzymanie ikony Todo Plus pokazuje skrót „Dodaj zadanie”.</p>
        <p><strong>iPhone.</strong> Skopiuj adres i w aplikacji Skróty utwórz „Dodaj zadanie” z akcją „Otwórz URL”. Dodaj go do widżetu Skróty na ekranie głównym lub przypisz do jednego z dolnych przycisków ekranu blokady (iOS 18 lub nowszy).</p>
        <button type="button" className="todo-shortcut-action" onClick={() => void copyAddress()}>Kopiuj adres skrótu</button>
        {message && <p role="status">{message}</p>}
        {manualAddress && <input aria-label="Adres skrótu" readOnly value={manualAddress} onFocus={(event) => event.currentTarget.select()} />}
      </div>
    </details>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { todoQuickAddFragment } from './todo-quick-add-path';

/** Opens a blank editor for the quick-add shortcut, including after sign-in. */
export function useTodoEditorLaunch() {
  const [launch, setLaunch] = useState<number | null>(() =>
    typeof window !== 'undefined' && window.location.hash === todoQuickAddFragment ? 1 : null
  );

  useEffect(() => {
    function clearFragment() {
      window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search);
    }

    if (window.location.hash === todoQuickAddFragment) clearFragment();

    function openFromFragment() {
      if (window.location.hash !== todoQuickAddFragment) return;
      clearFragment();
      setLaunch((current) => (current ?? 0) + 1);
    }

    window.addEventListener('hashchange', openFromFragment);
    return () => window.removeEventListener('hashchange', openFromFragment);
  }, []);

  return { launch, closeLaunch: () => setLaunch(null) };
}

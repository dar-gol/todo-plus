// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from 'vitest';
import { TodoViewPreferences } from './todo-view-preferences';

describe('TodoViewPreferences', () => {
  const preferences = new TodoViewPreferences();

  beforeEach(() => window.localStorage.clear());

  it('uses the task list until the user chooses another start view', () => {
    expect(preferences.load()).toBe('list');
  });

  it('persists the calendar as the start view', () => {
    preferences.save('calendar');

    expect(preferences.load()).toBe('calendar');
  });
});

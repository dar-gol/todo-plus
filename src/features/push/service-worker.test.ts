import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Todo Plus service worker alarm delivery', () => {
  it('requests sound, vibration and persistent presentation for alarm reminders', () => {
    const source = readFileSync(join(process.cwd(), 'public/sw.js'), 'utf8');

    expect(source).toContain('silent: alarm ? false : undefined');
    expect(source).toContain('renotify: alarm');
    expect(source).toContain('requireInteraction: alarm');
    expect(source).toContain('vibrate: [200, 100, 200, 100, 400]');
  });
});

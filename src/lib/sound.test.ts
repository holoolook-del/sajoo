import { describe, expect, it } from 'vitest';
import { isSoundEnabled, setSoundEnabled } from './sound.ts';

describe('sound 설정', () => {
  it('기본값은 켜짐이고 끄면 유지된다', () => {
    localStorage.removeItem('sajoo:sound');
    expect(isSoundEnabled()).toBe(true);
    setSoundEnabled(false);
    expect(isSoundEnabled()).toBe(false);
    setSoundEnabled(true);
    expect(isSoundEnabled()).toBe(true);
  });
});

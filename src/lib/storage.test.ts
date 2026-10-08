import { beforeEach, describe, expect, it } from 'vitest';
import { hasProfile, loadProfile, saveProfile } from './storage.ts';
import type { Profile } from './types.ts';

const profile: Profile = {
  v: 1,
  name: '홍길동',
  calendar: 'solar',
  isLeapMonth: false,
  year: 1992,
  month: 10,
  day: 24,
  hour: 5,
  minute: 30,
  gender: 'male',
  createdAt: '2026-10-08T00:00:00.000Z',
};

describe('storage (프로필)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('저장한 프로필을 그대로 읽는다', () => {
    expect(hasProfile()).toBe(false);
    saveProfile(profile);
    expect(hasProfile()).toBe(true);
    expect(loadProfile()).toEqual(profile);
  });

  it('깨진 JSON은 null을 반환한다', () => {
    localStorage.setItem('sajoo:profile', '{broken');
    expect(loadProfile()).toBeNull();
  });
});

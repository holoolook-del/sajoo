import { useMemo } from 'react';
import { calcSaju, type SajuResult } from '../../lib/engine.ts';
import { loadProfile } from '../../lib/storage.ts';
import type { Profile } from '../../lib/types.ts';

/** 저장된 프로필로 사주를 계산해 돌려준다. 페이지 공용 진입점. */
export function useSaju(): { profile: Profile | null; saju: SajuResult | null } {
  const profile = loadProfile();
  const saju = useMemo(() => {
    if (!profile) return null;
    const r = calcSaju({
      year: profile.year,
      month: profile.month,
      day: profile.day,
      hour: profile.hour,
      minute: profile.minute,
      calendar: profile.calendar,
      isLeapMonth: profile.isLeapMonth,
      gender: profile.gender,
    });
    return r.ok ? r.data : null;
  }, [profile]);
  return { profile, saju };
}

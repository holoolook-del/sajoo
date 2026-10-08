import { useState } from 'react';
import { loadProfile, saveProfile } from '../../lib/storage.ts';
import type { Profile } from '../../lib/types.ts';

/** 프로필 읽기/저장 훅. 저장소 접근은 storage.ts만 한다. */
export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(() => loadProfile());

  function save(next: Profile) {
    saveProfile(next);
    setProfile(next);
  }

  return { profile, save };
}

import { useState } from 'react';
import { isSoundEnabled, setSoundEnabled } from '../lib/sound.ts';

/** 효과음 켜기/끄기 토글 — localStorage에 유지 */
export function SoundToggle() {
  const [on, setOn] = useState(isSoundEnabled);
  return (
    <button
      type="button"
      aria-label={on ? '효과음 끄기' : '효과음 켜기'}
      aria-pressed={on}
      onClick={() => {
        const next = !on;
        setSoundEnabled(next);
        setOn(next);
      }}
      className="text-lg leading-none text-hanji/60 transition-colors hover:text-gold-bright"
    >
      {on ? '🔔' : '🔕'}
    </button>
  );
}

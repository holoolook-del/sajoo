import { useState, type FormEvent } from 'react';
import { formToBirthInput, formToProfile, profileFormSchema, type ProfileFormValues } from './profile-schema.ts';
import { validateBirthInput } from '../../lib/engine.ts';
import type { Profile } from '../../lib/types.ts';

interface Props {
  initial?: Profile;
  onSubmit: (profile: Profile) => void;
}

const inputCls =
  'w-full rounded-lg border border-hanji/20 bg-night-soft px-3 py-2 text-hanji outline-none focus:border-gold';
const labelCls = 'mb-1 block text-sm text-hanji/70';
const errCls = 'mt-1 text-sm text-vermilion';

export function ProfileForm({ initial, onSubmit }: Props) {
  const [name, setName] = useState(initial?.name ?? '');
  const [calendar, setCalendar] = useState<'solar' | 'lunar'>(initial?.calendar ?? 'solar');
  const [isLeapMonth, setIsLeapMonth] = useState(initial?.isLeapMonth ?? false);
  const [year, setYear] = useState(initial ? String(initial.year) : '');
  const [month, setMonth] = useState(initial ? String(initial.month) : '');
  const [day, setDay] = useState(initial ? String(initial.day) : '');
  const [birthHourUnknown, setBirthHourUnknown] = useState(initial ? initial.hour === null : false);
  const [hour, setHour] = useState(initial?.hour != null ? String(initial.hour) : '12');
  const [minute, setMinute] = useState(initial?.minute != null ? String(initial.minute) : '0');
  const [gender, setGender] = useState<'male' | 'female' | ''>(initial?.gender ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const raw: ProfileFormValues = {
      name,
      calendar,
      isLeapMonth,
      year: Number(year),
      month: Number(month),
      day: Number(day),
      birthHourUnknown,
      hour: birthHourUnknown ? null : Number(hour),
      minute: birthHourUnknown ? null : Number(minute),
      gender: gender as 'male' | 'female',
    };
    const parsed = profileFormSchema.safeParse(raw);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? 'form');
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    const valid = validateBirthInput(formToBirthInput(parsed.data));
    if (!valid.ok) {
      setErrors({ form: valid.error });
      return;
    }
    setErrors({});
    onSubmit(formToProfile(parsed.data));
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-sm flex-col gap-4" noValidate>
      <div>
        <label htmlFor="pf-name" className={labelCls}>이름 (또는 닉네임)</label>
        <input id="pf-name" className={inputCls} value={name} onChange={(e) => setName(e.target.value)} maxLength={10} />
        {errors.name && <p className={errCls}>{errors.name}</p>}
      </div>

      <fieldset>
        <legend className={labelCls}>달력</legend>
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input type="radio" name="calendar" checked={calendar === 'solar'} onChange={() => setCalendar('solar')} /> 양력
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="calendar" checked={calendar === 'lunar'} onChange={() => setCalendar('lunar')} /> 음력
          </label>
          {calendar === 'lunar' && (
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={isLeapMonth} onChange={(e) => setIsLeapMonth(e.target.checked)} /> 윤달
            </label>
          )}
        </div>
      </fieldset>

      <div className="flex gap-2">
        <div className="flex-1">
          <label htmlFor="pf-year" className={labelCls}>년</label>
          <input id="pf-year" type="number" inputMode="numeric" placeholder="1992" className={inputCls} value={year} onChange={(e) => setYear(e.target.value)} />
        </div>
        <div className="flex-1">
          <label htmlFor="pf-month" className={labelCls}>월</label>
          <input id="pf-month" type="number" inputMode="numeric" placeholder="10" className={inputCls} value={month} onChange={(e) => setMonth(e.target.value)} />
        </div>
        <div className="flex-1">
          <label htmlFor="pf-day" className={labelCls}>일</label>
          <input id="pf-day" type="number" inputMode="numeric" placeholder="24" className={inputCls} value={day} onChange={(e) => setDay(e.target.value)} />
        </div>
      </div>
      {(errors.year || errors.month || errors.day) && (
        <p className={errCls}>{errors.year ?? errors.month ?? errors.day}</p>
      )}

      <fieldset>
        <legend className={labelCls}>태어난 시</legend>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={birthHourUnknown} onChange={(e) => setBirthHourUnknown(e.target.checked)} /> 생시 모름
          </label>
          {!birthHourUnknown && (
            <div className="flex flex-1 items-center gap-2">
              <select aria-label="시" className={inputCls} value={hour} onChange={(e) => setHour(e.target.value)}>
                {Array.from({ length: 24 }, (_, h) => (
                  <option key={h} value={h}>{String(h).padStart(2, '0')}시</option>
                ))}
              </select>
              <select aria-label="분" className={inputCls} value={minute} onChange={(e) => setMinute(e.target.value)}>
                {Array.from({ length: 60 }, (_, m) => (
                  <option key={m} value={m}>{String(m).padStart(2, '0')}분</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </fieldset>

      <fieldset>
        <legend className={labelCls}>성별 (대운 계산에 필요)</legend>
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input type="radio" name="gender" checked={gender === 'male'} onChange={() => setGender('male')} /> 남
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="gender" checked={gender === 'female'} onChange={() => setGender('female')} /> 여
          </label>
        </div>
        {errors.gender && <p className={errCls}>{errors.gender}</p>}
      </fieldset>

      {errors.form && <p role="alert" className={errCls}>{errors.form}</p>}

      <button type="submit" className="mt-2 rounded-lg bg-gold px-4 py-3 font-bold text-night">
        저장하고 사주 보기
      </button>
    </form>
  );
}

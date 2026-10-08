import { z } from 'zod';
import type { SajuBirthInput } from '../../lib/engine.ts';
import type { Profile } from '../../lib/types.ts';

export const profileFormSchema = z.object({
  name: z.string().trim().min(1, '이름을 입력해 주세요').max(10, '10자 이내로 입력해 주세요'),
  calendar: z.enum(['solar', 'lunar']),
  isLeapMonth: z.boolean(),
  year: z.number({ error: '연도를 숫자로 입력해 주세요' }).int().min(1800).max(2300),
  month: z.number({ error: '월을 숫자로 입력해 주세요' }).int().min(1).max(12),
  day: z.number({ error: '일을 숫자로 입력해 주세요' }).int().min(1).max(31),
  birthHourUnknown: z.boolean(),
  hour: z.number().int().min(0).max(23).nullable(),
  minute: z.number().int().min(0).max(59).nullable(),
  gender: z.enum(['male', 'female'], { error: '성별을 선택해 주세요' }),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;

export function formToBirthInput(v: ProfileFormValues): SajuBirthInput {
  return {
    year: v.year,
    month: v.month,
    day: v.day,
    hour: v.birthHourUnknown ? null : v.hour,
    minute: v.birthHourUnknown ? null : (v.minute ?? 0),
    calendar: v.calendar,
    isLeapMonth: v.calendar === 'lunar' ? v.isLeapMonth : false,
    gender: v.gender,
  };
}

export function formToProfile(v: ProfileFormValues): Profile {
  return {
    v: 1,
    name: v.name,
    calendar: v.calendar,
    isLeapMonth: v.calendar === 'lunar' ? v.isLeapMonth : false,
    year: v.year,
    month: v.month,
    day: v.day,
    hour: v.birthHourUnknown ? null : v.hour,
    minute: v.birthHourUnknown ? null : (v.minute ?? 0),
    gender: v.gender,
    createdAt: new Date().toISOString(),
  };
}

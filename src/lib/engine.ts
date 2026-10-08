import {
  LUNAR_MAX_YEAR,
  LUNAR_MIN_YEAR,
  calculateFourPillars,
  isValidSolarDate,
  lunarToSolar,
  solarToLunar,
} from 'manseryeok';
import type { LunarDate, SolarDate } from 'manseryeok';
import { todayKST } from './date.ts';
import { err, ok, type Result } from './result.ts';
import type { CalendarKind, Gender } from './types.ts';

export interface SajuBirthInput {
  year: number;
  month: number;
  day: number;
  hour: number | null;
  minute: number | null;
  calendar: CalendarKind;
  isLeapMonth: boolean;
  gender: Gender;
}

export interface SajuPillar {
  korean: string; // '임신'
  hanja: string; // '壬申'
  stemHanja: string;
  branchHanja: string;
  stemElement: string;
  branchElement: string;
  stemYinYang: string;
  branchYinYang: string;
  tenGodStem: string;
  tenGodBranch: string;
}

export interface SajuResult {
  pillars: { year: SajuPillar; month: SajuPillar; day: SajuPillar; hour: SajuPillar | null };
  hourIncluded: boolean;
  dayMaster: { korean: string; hanja: string; element: string; yinYang: string };
  voidBranches: string[];
  luckPillars: {
    forward: boolean;
    startAge: number;
    pillars: { age: number; korean: string }[];
  } | null;
  solar: SolarDate;
  lunar: LunarDate;
}

const SOLAR_MIN_YEAR = 1800;
const SOLAR_MAX_YEAR = 2300;

export interface Iljin {
  korean: string; // '계유'
  hanja: string; // '癸酉'
  stem: string; // '계' — 천간 한글
  branch: string; // '유' — 지지 한글
  stemHanja: string;
  branchHanja: string;
  stemElement: string;
  branchElement: string;
}

/** 특정 양력 날짜의 일진(그날의 일주)을 계산한다. */
export function iljinOf(year: number, month: number, day: number): Iljin {
  const d = calculateFourPillars({
    year, month, day, hour: 12, minute: 0, dayBoundary: 'jasi',
  });
  return {
    korean: d.dayString,
    hanja: d.dayHanja,
    stem: d.dayString.charAt(0),
    branch: d.dayString.charAt(1),
    stemHanja: d.dayHanja.charAt(0),
    branchHanja: d.dayHanja.charAt(1),
    stemElement: d.dayElement.stem,
    branchElement: d.dayElement.branch,
  };
}

/** 입력을 검증한다. 실패 시 사용자에게 보여줄 한국어 문구를 돌려준다. */
export function validateBirthInput(input: SajuBirthInput): Result<true> {
  const { year, month, day, calendar } = input;
  if (month < 1 || month > 12 || day < 1 || day > 31 || !Number.isInteger(year)) {
    return err('올바르지 않은 날짜입니다.');
  }
  let solar: SolarDate;
  if (calendar === 'lunar') {
    if (year < LUNAR_MIN_YEAR || year > LUNAR_MAX_YEAR) {
      return err(`음력은 ${LUNAR_MIN_YEAR}~${LUNAR_MAX_YEAR}년만 지원합니다.`);
    }
    try {
      solar = lunarToSolar(year, month, day, input.isLeapMonth);
    } catch {
      return err('올바르지 않은 음력 날짜입니다. (윤달 여부를 확인해 주세요)');
    }
  } else {
    if (year < SOLAR_MIN_YEAR || year > SOLAR_MAX_YEAR) {
      return err(`양력은 ${SOLAR_MIN_YEAR}~${SOLAR_MAX_YEAR}년만 지원합니다.`);
    }
    if (!isValidSolarDate(year, month, day)) {
      return err('올바르지 않은 날짜입니다.');
    }
    solar = { year, month, day };
  }
  const solarStr = `${solar.year}-${String(solar.month).padStart(2, '0')}-${String(solar.day).padStart(2, '0')}`;
  if (solarStr > todayKST()) {
    return err('미래 날짜는 입력할 수 없습니다.');
  }
  if (input.hour !== null && (input.hour < 0 || input.hour > 23)) {
    return err('시는 0~23시 사이입니다.');
  }
  if (input.minute !== null && (input.minute < 0 || input.minute > 59)) {
    return err('분은 0~59분 사이입니다.');
  }
  return ok(true);
}

/**
 * 만세력 사주를 계산한다. 한국 정통 관법: 일 경계는 자시(23:00) 기준.
 * 생시를 모르면(hour=null) 시주 없이 3주만 반환한다. 던지지 않고 Result로 돌려준다.
 */
export function calcSaju(input: SajuBirthInput): Result<SajuResult> {
  const valid = validateBirthInput(input);
  if (!valid.ok) return valid;

  const hourIncluded = input.hour !== null;
  try {
    const d = calculateFourPillars({
      year: input.year,
      month: input.month,
      day: input.day,
      // 생시를 모르면 정오로 계산해 시주만 버린다 (일주는 정오 기준이면 경계 오차 없음)
      hour: input.hour ?? 12,
      minute: input.minute ?? 0,
      isLunar: input.calendar === 'lunar',
      isLeapMonth: input.isLeapMonth,
      dayBoundary: 'jasi',
      gender: input.gender,
    });

    const hanja = d.toHanjaObject();
    const toPillar = (
      kind: 'year' | 'month' | 'day' | 'hour',
      korean: string,
      tenGodStem: string,
      tenGodBranch: string,
      element: { stem: string; branch: string },
      yinYang: { stem: string; branch: string },
    ): SajuPillar => {
      return {
        korean,
        hanja: hanja[kind].hanja,
        stemHanja: hanja[kind].hanja.charAt(0),
        branchHanja: hanja[kind].hanja.charAt(1),
        stemElement: element.stem,
        branchElement: element.branch,
        stemYinYang: yinYang.stem,
        branchYinYang: yinYang.branch,
        tenGodStem,
        tenGodBranch,
      };
    };

    const pillars = {
      year: toPillar('year', d.yearString, d.tenGods.year.stem, d.tenGods.year.branch, d.yearElement, d.yearYinYang),
      month: toPillar('month', d.monthString, d.tenGods.month.stem, d.tenGods.month.branch, d.monthElement, d.monthYinYang),
      day: toPillar('day', d.dayString, '일간', d.tenGods.day.branch, d.dayElement, d.dayYinYang),
      hour: hourIncluded
        ? toPillar('hour', d.hourString, d.tenGods.hour.stem, d.tenGods.hour.branch, d.hourElement, d.hourYinYang)
        : null,
    };

    const solar = input.calendar === 'lunar'
      ? lunarToSolar(input.year, input.month, input.day, input.isLeapMonth)
      : { year: input.year, month: input.month, day: input.day };

    return ok({
      pillars,
      hourIncluded,
      dayMaster: {
        korean: pillars.day.korean.charAt(0),
        hanja: pillars.day.hanja.charAt(0),
        element: pillars.day.stemElement,
        yinYang: pillars.day.stemYinYang,
      },
      voidBranches: [...d.voidBranches],
      luckPillars: d.luckPillars
        ? {
            forward: d.luckPillars.forward,
            startAge: d.luckPillars.startAge,
            pillars: d.luckPillars.pillars.map((p) => ({ age: p.age, korean: p.korean })),
          }
        : null,
      solar,
      lunar: solarToLunar(solar.year, solar.month, solar.day),
    });
  } catch (e) {
    return err(e instanceof Error ? e.message : '사주를 계산할 수 없습니다.');
  }
}


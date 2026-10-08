import { Link } from 'react-router-dom';

/**
 * 상단 홈 복귀 버튼 — 회색 텍스트 링크가 눈에 띄지 않는다는 피드백으로
 * 골드 테두리의 필(pill) 버튼으로 통일한다.
 */
export function BackHome() {
  return (
    <Link
      to="/"
      className="inline-flex items-center gap-1.5 rounded-full border border-gold/50 bg-night-soft px-3.5 py-1.5 text-xs font-bold text-gold-bright shadow-[0_0_12px_rgba(201,162,39,0.12)] transition-colors hover:border-gold/80 hover:bg-gold/10"
    >
      ← 홈
    </Link>
  );
}

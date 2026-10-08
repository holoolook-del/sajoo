import { useEffect, useRef } from 'react';

const A = import.meta.env.BASE_URL;
const TAU = Math.PI * 2;

/**
 * 별 트윙클 — 작은 캔버스에 별을 찍고 불투명도를 천천히 흔든다.
 * WebGL 대신 캔버스: 별 90개면 2D로 충분하고 번들 무게 0.
 */
function Stars() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    let stars: { x: number; y: number; r: number; p: number }[] = [];

    const resize = () => {
      const dpr = Math.min(devicePixelRatio, 2);
      canvas.width = innerWidth * dpr;
      canvas.height = innerHeight * dpr;
      stars = Array.from({ length: 90 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height * 0.75, // 하단 소녀 실루엣 구역은 비움
        r: (Math.random() * 1.2 + 0.4) * dpr,
        p: Math.random() * TAU,
      }));
    };
    resize();
    addEventListener('resize', resize);

    const draw = (t: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fdf6e3';
      for (const s of stars) {
        ctx.globalAlpha = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(t / 1600 + s.p));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, TAU);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (!reduced) raf = requestAnimationFrame(draw);
    };
    draw(0);

    return () => {
      cancelAnimationFrame(raf);
      removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={ref} className="absolute inset-0 h-full w-full" />;
}

/**
 * 구름 레이어 — 같은 이미지 2장을 가로로 이어 붙이고 translateX(-50%)까지 밀면
 * 끝과 시작이 맞물려 무한 드리프트가 된다 (일반적인 이중-텍스처 스크롤 기법).
 */
function CloudLayer({ img, top, opacity, seconds, flip }: { img: string; top: string; opacity: number; seconds: number; flip?: boolean }) {
  const imgCls = `w-1/2 object-cover${flip ? ' -scale-x-100' : ''}`;
  return (
    <div
      className="absolute flex w-[200%] animate-[drift_linear_infinite] mix-blend-screen motion-reduce:animate-none"
      style={{ top, opacity, animationDuration: `${seconds}s` }}
    >
      <img src={`${A}assets/bg/${img}.webp`} alt="" className={imgCls} />
      <img src={`${A}assets/bg/${img}.webp`} alt="" className={imgCls} />
    </div>
  );
}

/**
 * 몽환 밤하늘 배경 — 모든 페이지 뒤에 깔리는 고정 레이어.
 * 별 트윙클 + 두 층의 구름 드리프트만 띄운다 (달·인물은 화면이 산만해져 제외).
 * pointer-events-none + -z-10이라 어떤 콘텐츠도 가리지 않는다.
 */
export function NightBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-gradient-to-b from-[#07060d] via-[#12101d] to-night"
    >
      <Stars />
      {/* 같은 구름 이미지를 두 층으로 — 좌우 색이 다른 이미지 2개를 섞으면 톤이 깨진다.
          아래층은 좌우반전+느린 속도+낮은 투명도로 원근감만 준다 */}
      <CloudLayer img="clouds-a" top="12%" opacity={0.55} seconds={90} />
      <CloudLayer img="clouds-a" top="30%" opacity={0.28} seconds={150} flip />
    </div>
  );
}

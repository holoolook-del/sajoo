import { Link } from 'react-router-dom';

/** 계산 불가·에러 등 공용 상태 화면 */
export function StateView({
  message,
  linkTo = '/',
  linkLabel = '홈으로',
}: {
  message: string;
  linkTo?: string;
  linkLabel?: string;
}) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6">
      <p className="text-hanji/70">{message}</p>
      <Link to={linkTo} className="text-gold underline">{linkLabel}</Link>
    </main>
  );
}

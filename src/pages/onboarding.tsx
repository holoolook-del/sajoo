import { useNavigate } from 'react-router-dom';
import { ProfileForm } from '../features/saju/profile-form.tsx';
import { useProfile } from '../features/saju/use-profile.ts';

export function OnboardingPage() {
  const { profile, save } = useProfile();
  const navigate = useNavigate();
  const editing = profile !== null;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 p-6">
      {!editing && (
        <div className="relative -mx-2 overflow-hidden rounded-2xl border border-gold/30">
          <img
            src={`${import.meta.env.BASE_URL}assets/illust/onboarding.webp`}
            alt=""
            className="h-44 w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-night/70 to-transparent" />
        </div>
      )}
      <header className="text-center">
        <h1 className="text-2xl font-bold text-gold">{editing ? '내 정보 수정' : '사주 정보 입력'}</h1>
        <p className="mt-1 whitespace-pre-line text-sm leading-6 text-hanji/60">
          {editing
            ? '생년월일시를 수정하면 모든 운세가 새로 계산됩니다'
            : '태어난 순간의 하늘 기운으로 네 개의 기둥을 세웁니다.\n만세력으로 사주팔자와 매일의 운세를 읽어드립니다.'}
        </p>
      </header>
      <ProfileForm
        initial={profile ?? undefined}
        submitLabel={editing ? '저장' : '저장하고 사주 보기'}
        onSubmit={(next) => {
          save(next);
          navigate(editing ? '/' : '/saju');
        }}
      />
    </main>
  );
}

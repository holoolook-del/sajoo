import { useNavigate } from 'react-router-dom';
import { ProfileForm } from '../features/saju/profile-form.tsx';
import { useProfile } from '../features/saju/use-profile.ts';

export function OnboardingPage() {
  const { profile, save } = useProfile();
  const navigate = useNavigate();
  const editing = profile !== null;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 p-6">
      <header className="pt-8 text-center">
        <h1 className="text-2xl font-bold text-gold">{editing ? '내 정보 수정' : '사주 정보 입력'}</h1>
        <p className="mt-1 text-sm text-hanji/60">생년월일시를 입력하면 만세력으로 사주를 계산합니다</p>
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

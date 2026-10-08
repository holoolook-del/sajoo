import { useNavigate } from 'react-router-dom';
import { ProfileForm } from '../features/saju/profile-form.tsx';
import { useProfile } from '../features/saju/use-profile.ts';

export function OnboardingPage() {
  const { save } = useProfile();
  const navigate = useNavigate();

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 p-6">
      <header className="pt-8 text-center">
        <h1 className="text-2xl font-bold text-gold">사주 정보 입력</h1>
        <p className="mt-1 text-sm text-hanji/60">생년월일시를 입력하면 만세력으로 사주를 계산합니다</p>
      </header>
      <ProfileForm
        onSubmit={(profile) => {
          save(profile);
          navigate('/saju');
        }}
      />
    </main>
  );
}

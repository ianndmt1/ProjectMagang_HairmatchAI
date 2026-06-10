import type { Metadata } from 'next';
import RegisterForm from '@/features/auth/presentation/register-form';

export const metadata: Metadata = {
  title: 'Daftar',
  description: 'Buat akun HairMatch AI gratis untuk mulai analisis bentuk wajah dan temukan model rambut ideal.',
};

export default function RegisterPage() {
  return <RegisterForm />;
}

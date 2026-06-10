import type { Metadata } from 'next';
import LoginForm from '@/features/auth/presentation/login-form';

export const metadata: Metadata = {
  title: 'Masuk',
  description: 'Masuk ke akun HairMatch AI Anda untuk analisis wajah dan booking barbershop.',
};

export default function LoginPage() {
  return <LoginForm />;
}

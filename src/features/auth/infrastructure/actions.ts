'use server';

import { createClient } from '@/lib/supabase/server';
import { loginSchema, registerSchema, type LoginInput, type RegisterInput } from '../domain/schemas';
import { redirect } from 'next/navigation';

export async function loginAction(formData: LoginInput) {
  const result = loginSchema.safeParse(formData);
  if (!result.success) {
    return { error: 'Data tidak valid' };
  }

  const { email, password } = result.data;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  redirect('/dashboard');
}

export async function registerAction(formData: RegisterInput) {
  const result = registerSchema.safeParse(formData);
  if (!result.success) {
    return { error: 'Data tidak valid' };
  }

  const { email, password, fullName } = result.data;
  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

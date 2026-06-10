'use client';

import React, { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '../domain/schemas';
import { loginAction } from '../infrastructure/actions';
import { Mail, Lock, Loader2, Sparkles, ChevronRight, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

export default function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = (data: LoginInput) => {
    setError(null);
    startTransition(async () => {
      const response = await loginAction(data);
      if (response?.error) {
        setError(response.error);
      }
    });
  };

  return (
    <div className="w-full max-w-md p-8 rounded-3xl bg-neutral-900/80 border border-neutral-800 backdrop-blur-xl shadow-2xl">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-violet-500/10 text-violet-400 mb-4 border border-violet-500/20">
          <Sparkles className="w-6 h-6 animate-pulse" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
          Selamat Datang di <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">HairMatch AI</span>
        </h1>
        <p className="text-sm text-neutral-400">
          Analisis bentuk wajah dan booking barber favorit Anda
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-medium">
            {error}
          </div>
        )}

        {/* Email Field */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block">
            Alamat Email
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-500 group-focus-within:text-violet-400 transition-colors">
              <Mail className="w-5 h-5" />
            </div>
            <input
              type="email"
              {...register('email')}
              placeholder="nama@email.com"
              disabled={isPending}
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-600 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all outline-none text-sm disabled:opacity-50"
            />
          </div>
          {errors.email && (
            <p className="text-rose-400 text-xs mt-1 font-medium">{errors.email.message}</p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Kata Sandi
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-violet-400 hover:text-violet-300 transition-colors"
            >
              Lupa sandi?
            </Link>
          </div>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-500 group-focus-within:text-violet-400 transition-colors">
              <Lock className="w-5 h-5" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              {...register('password')}
              placeholder="••••••••"
              disabled={isPending}
              className="w-full pl-11 pr-11 py-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-600 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all outline-none text-sm disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-neutral-500 hover:text-neutral-300 transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-rose-400 text-xs mt-1 font-medium">{errors.password.message}</p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-violet-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:scale-100"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Memproses masuk...</span>
            </>
          ) : (
            <>
              <span>Masuk Sekarang</span>
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Footer Link */}
      <div className="mt-8 pt-6 border-t border-neutral-800 text-center">
        <p className="text-sm text-neutral-400">
          Belum punya akun?{' '}
          <Link
            href="/register"
            className="font-semibold text-violet-400 hover:text-violet-300 transition-colors"
          >
            Daftar Gratis
          </Link>
        </p>
      </div>
    </div>
  );
}

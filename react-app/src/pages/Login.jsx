/**
 * @fileoverview Login Page
 * Authentication page with email/password login.
 *
 * @module pages/Login
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Factory, LogIn, Eye, EyeOff, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';

/**
 * Login Page Component
 */
export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { loginWithEmail, loginAsDemo, loading, error, clearError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    clearError?.();

    if (!email || !password) {
      setLocalError(t('login.emptyFields', '이메일과 비밀번호를 입력해주세요.'));
      return;
    }

    setIsLoggingIn(true);
    try {
      await loginWithEmail(email, password);
      navigate('/');
    } catch (err) {
      console.error('Login failed:', err);
      // Error is handled by AuthContext
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleDemoLogin = async () => {
    setIsLoggingIn(true);
    try {
      await loginAsDemo();
      navigate('/');
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen message={t('auth.checking', '인증 확인 중...')} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary p-4">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-blue-500 flex items-center justify-center">
            <Factory className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-primary mb-2">
            Rachgia Dashboard
          </h1>
          <p className="text-secondary">
            {t('login.subtitle', '베트남 Rachgia 공장 통합 생산관리 시스템')}
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-card rounded-2xl shadow-lg p-8">
          <h2 className="text-xl font-semibold text-center mb-6">
            {t('login.title', '로그인')}
          </h2>

          {/* Error Message */}
          {(localError || error) && (
            <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm">
              {localError || error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                {t('login.email', '이메일')}
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-primary border border-theme rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                placeholder="example@company.com"
                disabled={isLoggingIn}
                autoComplete="email"
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                {t('login.password', '비밀번호')}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-primary border border-theme rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all pr-12"
                  placeholder="••••••••"
                  disabled={isLoggingIn}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-primary transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoggingIn ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>{t('login.loginButton', '로그인')}</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-theme" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-card text-secondary">
                {t('login.or', '또는')}
              </span>
            </div>
          </div>

          {/* Demo Mode */}
          <button
            onClick={handleDemoLogin}
            disabled={isLoggingIn}
            className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoggingIn ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <span className="font-medium text-gray-600 dark:text-gray-400">
                  {t('login.demo', '데모 모드로 시작')}
                </span>
              </>
            )}
          </button>

          {/* Info */}
          <p className="mt-6 text-center text-xs text-secondary">
            {t('login.info', '로그인하면 이용약관 및 개인정보 처리방침에 동의하게 됩니다.')}
          </p>
        </div>

        {/* Version */}
        <p className="mt-6 text-center text-xs text-secondary">
          v19.0.0 • © 2024-2025 Rachgia Factory
        </p>
      </div>
    </div>
  );
}

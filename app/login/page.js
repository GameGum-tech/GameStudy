'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import './auth.css';

function LoginContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signInWithEmail, signInWithGoogle, signInWithGithub, user, isSupabaseEnabled } = useAuth();

  useEffect(() => {
    // Supabaseが未設定の場合は警告を表示
    if (!isSupabaseEnabled) {
      setError('認証機能は現在利用できません。Supabaseの設定を完了してください。');
    }
    
    if (user) {
      router.push('/');
    }
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setError(errorParam);
    }
  }, [user, router, searchParams, isSupabaseEnabled]);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    
    if (!isSupabaseEnabled) {
      setError('認証機能は現在利用できません。Supabaseの設定を完了してください。');
      return;
    }
    
    setError('');
    setLoading(true);

    const { error } = await signInWithEmail(email, password);
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/');
    }
  };

  const handleGoogleLogin = async () => {
    if (!isSupabaseEnabled) {
      setError('認証機能は現在利用できません。Supabaseの設定を完了してください。');
      return;
    }
    
    setError('');
    const { error } = await signInWithGoogle();
    if (error) {
      setError(error.message);
    }
  };

  const handleGithubLogin = async () => {
    if (!isSupabaseEnabled) {
      setError('認証機能は現在利用できません。Supabaseの設定を完了してください。');
      return;
    }
    
    setError('');
    const { error } = await signInWithGithub();
    if (error) {
      setError(error.message);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <h1>ログイン</h1>
          <p className="auth-subtitle">GameStudyにログインしましょう</p>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="social-buttons">
            <button
              onClick={handleGoogleLogin}
              className="social-btn google-btn"
              type="button"
            >
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 002.38-5.88c0-.57-.05-.66-.15-1.18z"/>
                <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 01-7.18-2.54H1.83v2.07A8 8 0 008.98 17z"/>
                <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 010-3.04V5.41H1.83a8 8 0 000 7.18l2.67-2.07z"/>
                <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 001.83 5.4L4.5 7.49a4.77 4.77 0 014.48-3.3z"/>
              </svg>
              Googleでログイン
            </button>

            <button
              onClick={handleGithubLogin}
              className="social-btn github-btn"
              type="button"
            >
              <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
              </svg>
              GitHubでログイン
            </button>
          </div>

          <div className="divider">
            <span>または</span>
          </div>

          <form onSubmit={handleEmailLogin}>
            <div className="form-group">
              <label htmlFor="email">メールアドレス</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">パスワード</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              className="submit-btn"
              disabled={loading}
            >
              {loading ? 'ログイン中...' : 'ログイン'}
            </button>
          </form>

          <p className="auth-footer">
            アカウントをお持ちでないですか？{' '}
            <Link href="/signup">新規登録</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-card">
            <p>読み込み中...</p>
          </div>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, isSupabaseEnabled } from '../../../lib/supabase';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      // Supabaseが未設定の場合はトップページにリダイレクト
      if (!isSupabaseEnabled()) {
        console.warn('Supabaseが設定されていません');
        router.push('/?error=認証機能が無効です');
        return;
      }

      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error('認証エラー:', error);
          router.push('/login?error=認証に失敗しました');
        } else if (data.session) {
          router.push('/');
        } else {
          router.push('/login');
        }
      } catch (err) {
        console.error('認証処理エラー:', err);
        router.push('/login?error=認証に失敗しました');
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      flexDirection: 'column',
      gap: '16px'
    }}>
      <div>認証処理中...</div>
      <div style={{ 
        width: '40px', 
        height: '40px', 
        border: '4px solid #f3f3f3',
        borderTop: '4px solid #5271ff',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

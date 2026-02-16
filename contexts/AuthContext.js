'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseEnabled } from '../lib/supabase';

const AuthContext = createContext({});

// デモユーザー情報
const DEMO_USER = {
  id: 'demo-user-123',
  email: 'demo@gamestudy.com',
  user_metadata: {
    display_name: 'デモユーザー',
    full_name: 'デモユーザー',
    avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=Demo',
  },
  created_at: new Date().toISOString(),
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // ユーザーがデータベースに存在することを確認し、存在しない場合は作成
  const ensureUserInDatabase = async (supabaseUser) => {
    try {
      const userData = {
        auth_uid: supabaseUser.id,
        email: supabaseUser.email,
        username: supabaseUser.user_metadata?.username || supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0],
        display_name: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.display_name || supabaseUser.email?.split('@')[0],
        avatar_url: supabaseUser.user_metadata?.avatar_url || supabaseUser.user_metadata?.picture,
      };

      console.log('🔄 Ensuring user in database:', userData);

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ User ensured in database:', result);
      } else {
        console.error('❌ Failed to ensure user in database:', await response.text());
      }
    } catch (error) {
      console.error('❌ Error ensuring user in database:', error);
    }
  };

  useEffect(() => {
    // Supabaseが有効な場合のみ認証処理を実行
    if (!isSupabaseEnabled()) {
      // デモモードのセッションをチェック
      const demoSession = localStorage.getItem('demo_session');
      if (demoSession === 'active') {
        setUser(DEMO_USER);
        setIsDemoMode(true);
      }
      setLoading(false);
      return;
    }

    // 現在のセッションを確認
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null);
      
      // 既存セッションがある場合、ユーザーがDBに存在することを確認
      if (session?.user) {
        await ensureUserInDatabase(session.user);
      }
      
      setLoading(false);
    }).catch((error) => {
      console.warn('Supabase認証エラー:', error);
      setLoading(false);
    });

    // 認証状態の変更を監視
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 Auth state changed:', event, session?.user?.id);
      setUser(session?.user ?? null);
      
      // ログイン時に常にデータベースのユーザーを確認
      if (session?.user) {
        await ensureUserInDatabase(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithEmail = async (email, password) => {
    if (!isSupabaseEnabled()) {
      return { data: null, error: { message: 'Supabaseが設定されていません' } };
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signUpWithEmail = async (email, password, metadata = {}) => {
    if (!isSupabaseEnabled()) {
      return { data: null, error: { message: 'Supabaseが設定されていません' } };
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });
    return { data, error };
  };

  const signInWithGoogle = async () => {
    if (!isSupabaseEnabled()) {
      return { data: null, error: { message: 'Supabaseが設定されていません' } };
    }
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { data, error };
  };

  const signInWithGithub = async () => {
    if (!isSupabaseEnabled()) {
      return { data: null, error: { message: 'Supabaseが設定されていません' } };
    }
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { data, error };
  };

  const signOut = async () => {
    if (!isSupabaseEnabled()) {
      // デモモードのログアウト
      if (isDemoMode) {
        localStorage.removeItem('demo_session');
        setUser(null);
        setIsDemoMode(false);
      }
      return { error: null };
    }
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const signInWithDemo = () => {
    // デモモードでログイン
    localStorage.setItem('demo_session', 'active');
    setUser(DEMO_USER);
    setIsDemoMode(true);
    return { error: null };
  };

  const value = {
    user,
    loading,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signInWithGithub,
    signOut,
    signInWithDemo,
    isSupabaseEnabled: isSupabaseEnabled(),
    isDemoMode,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

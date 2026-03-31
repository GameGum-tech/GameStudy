"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Suspense, useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useRouter } from 'next/navigation';
import TagNavigation from './TagNavigation';

export default function Header() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const { user, signOut, isSupabaseEnabled, signInWithDemo, isDemoMode } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  // ドロップダウン外クリックで閉じる
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setShowDropdown(false);
    router.push('/');
  };

  const handleDemoLogin = () => {
    signInWithDemo();
  };

  // ユーザーアバター画像を取得（Google/GitHubの画像 or デフォルト）
  const getAvatarUrl = () => {
    if (user?.user_metadata?.avatar_url) {
      return user.user_metadata.avatar_url;
    }
    // Gravatar風のデフォルトアイコン
    return `https://api.dicebear.com/7.x/initials/svg?seed=${user?.email || 'user'}`;
  };

  const getDisplayName = () => {
    return user?.user_metadata?.display_name || 
           user?.user_metadata?.full_name || 
           user?.email?.split('@')[0] || 
           'ユーザー';
  };

  return (
    <header className="note-header">
      <div className="container">
        <Link href="/" className="logo">
          GameStudy
          <span className="beta-badge">Beta</span>
        </Link>
        <div className="search-container">
          <input 
            type="text" 
            placeholder="キーワードで検索"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <nav className="main-nav">
          <button 
            onClick={toggleTheme}
            className="theme-toggle-btn"
            aria-label="テーマ切り替え"
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              {theme === 'light' ? 'dark_mode' : 'light_mode'}
            </span>
          </button>
          {user ? (
            <>
              <Link href="/articles/new" className="create-btn">
                <span className="material-symbols-outlined" aria-hidden="true">edit_square</span>
                記事を書く
              </Link>
              <div className="user-menu" ref={dropdownRef}>
                <button 
                  className="user-avatar-btn"
                  onClick={() => setShowDropdown(!showDropdown)}
                >
                  <Image 
                    src={getAvatarUrl()} 
                    alt="ユーザーアバター"
                    width={36}
                    height={36}
                    className="user-avatar"
                  />
                </button>
                {showDropdown && (
                  <div className="dropdown-menu">
                    <div className="dropdown-header">
                      <div className="dropdown-user-info">
                        <div className="dropdown-user-name">{getDisplayName()}</div>
                        <div className="dropdown-user-email">{user.email}</div>
                      </div>
                    </div>
                    <div className="dropdown-divider"></div>
                    <Link href="/mypage" className="dropdown-item" onClick={() => setShowDropdown(false)}>
                      <span className="dropdown-item-content">
                        <span className="material-symbols-outlined" aria-hidden="true">person</span>
                        マイページ
                      </span>
                    </Link>
                    <Link href="/articles/new" className="dropdown-item" onClick={() => setShowDropdown(false)}>
                      <span className="dropdown-item-content">
                        <span className="material-symbols-outlined" aria-hidden="true">edit_square</span>
                        記事を書く
                      </span>
                    </Link>
                    <div className="dropdown-divider"></div>
                    {isDemoMode && (
                      <div className="dropdown-demo-badge">
                        <span className="material-symbols-outlined" aria-hidden="true">theater_comedy</span>
                        デモモード
                      </div>
                    )}
                    <button className="dropdown-item" onClick={handleSignOut}>
                      <span className="dropdown-item-content">
                        <span className="material-symbols-outlined" aria-hidden="true">logout</span>
                        ログアウト
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {!isSupabaseEnabled && (
                <button onClick={handleDemoLogin} className="demo-login-btn">
                  <span className="material-symbols-outlined" aria-hidden="true">theater_comedy</span>
                  デモモードでログイン
                </button>
              )}
              <Link href="/login">ログイン</Link>
              <Link href="/signup" className="signup-btn">会員登録</Link>
            </>
          )}
        </nav>
      </div>
      
      {/* タグナビゲーション */}
      <Suspense fallback={<div className="tag-navigation-wrapper"><nav className="tag-navigation"></nav></div>}>
        <TagNavigation />
      </Suspense>
    </header>
  );
}

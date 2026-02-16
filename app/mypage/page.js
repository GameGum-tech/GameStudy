'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '../../contexts/AuthContext';
import './mypage.css';

export default function MyPage() {
  const { user, loading, isDemoMode } = useAuth();
  const [articles, setArticles] = useState([]);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();
  const { isSupabaseEnabled } = useAuth();

  useEffect(() => {
    // Supabaseが未設定の場合はトップページにリダイレクト
    if (!isSupabaseEnabled && !isDemoMode) {
      setError('認証機能が有効になっていません。Supabaseの設定を完了してください。');
      setTimeout(() => router.push('/'), 3000);
      setFetchLoading(false);
      return;
    }
    
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router, isSupabaseEnabled, isDemoMode]);

  useEffect(() => {
    if (user) {
      fetchMyArticles();
    }
  }, [user]);

  const fetchMyArticles = async () => {
    try {
      // TODO: ユーザーの記事を取得するAPIエンドポイントを作成
      // 現在は全記事を取得して表示（実装例）
      const res = await fetch('/api/articles');
      if (!res.ok) throw new Error('記事の取得に失敗しました');
      const data = await res.json();
      setArticles(data.articles || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setFetchLoading(false);
    }
  };

  const getDisplayName = () => {
    return user?.user_metadata?.display_name || 
           user?.user_metadata?.full_name || 
           user?.email?.split('@')[0] || 
           'ユーザー';
  };

  const getAvatarUrl = () => {
    if (user?.user_metadata?.avatar_url) {
      return user.user_metadata.avatar_url;
    }
    return `https://api.dicebear.com/7.x/initials/svg?seed=${user?.email || 'user'}`;
  };

  if (loading || !user) {
    return (
      <div className="mypage-loading">
        <p>読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="mypage">
      <div className="mypage-container">
        {/* プロフィールセクション */}
        <div className="profile-section">
          <div className="profile-card">
            {isDemoMode && (
              <div className="demo-badge">
                🎭 デモモード
              </div>
            )}
            <Image
              src={getAvatarUrl()}
              alt="プロフィール画像"
              width={120}
              height={120}
              className="profile-avatar"
            />
            <h1 className="profile-name">{getDisplayName()}</h1>
            <p className="profile-email">{user.email}</p>
            {isDemoMode && (
              <p className="demo-note">
                これはデモアカウントです。実際の記事作成・編集機能を試すことができます。
              </p>
            )}
            <div className="profile-stats">
              <div className="stat-item">
                <span className="stat-number">{articles.length}</span>
                <span className="stat-label">記事</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">0</span>
                <span className="stat-label">フォロワー</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">0</span>
                <span className="stat-label">いいね</span>
              </div>
            </div>
          </div>
        </div>

        {/* 記事管理セクション */}
        <div className="articles-section">
          <div className="section-header">
            <h2>📝 あなたの記事</h2>
            <Link href="/articles/new" className="new-article-btn">
              ✏️ 新しい記事を書く
            </Link>
          </div>

          {fetchLoading ? (
            <div className="articles-loading">
              <p>記事を読み込んでいます...</p>
            </div>
          ) : error ? (
            <div className="articles-error">
              <p>{error}</p>
            </div>
          ) : articles.length === 0 ? (
            <div className="no-articles">
              <p>まだ記事がありません</p>
              <Link href="/articles/new" className="create-first-article">
                最初の記事を書く
              </Link>
            </div>
          ) : (
            <div className="articles-list">
              {articles.map((article) => (
                <div key={article.id} className="mypage-article-card">
                  {article.thumbnail_url && (
                    <div className="mypage-thumbnail">
                      <Image
                        src={article.thumbnail_url}
                        alt={article.title}
                        width={200}
                        height={120}
                        className="mypage-thumbnail-image"
                      />
                    </div>
                  )}
                  <div className="mypage-article-content">
                    <h3>
                      <Link href={`/articles/${article.slug}`}>
                        {article.title}
                      </Link>
                    </h3>
                    <p className="mypage-article-excerpt">
                      {article.excerpt || article.content?.substring(0, 100) + '...'}
                    </p>
                    <div className="mypage-article-meta">
                      <span className="article-date">
                        {new Date(article.created_at).toLocaleDateString('ja-JP')}
                      </span>
                      <div className="article-actions">
                        <Link href={`/articles/${article.slug}/edit`} className="action-link">
                          編集
                        </Link>
                        <span className="action-separator">|</span>
                        <button className="action-link delete-link">
                          削除
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from '../../../contexts/AuthContext';
import '../../articles/[slug]/edit/edit.css';

export default function NewArticlePage() {
  const { user, loading, isDemoMode } = useAuth();
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [userRegistered, setUserRegistered] = useState(false);
  const router = useRouter();
  const { isSupabaseEnabled } = useAuth();

  // ユーザーをデータベースに登録
  useEffect(() => {
    const ensureUserInDatabase = async () => {
      if (!user || isDemoMode) return;
      
      try {
        console.log('🔄 記事作成ページ: ユーザー登録を確認中...', user.id);
        
        const userData = {
          auth_uid: user.id,
          email: user.email,
          username: user.user_metadata?.username || user.user_metadata?.full_name || user.email?.split('@')[0],
          display_name: user.user_metadata?.full_name || user.user_metadata?.display_name || user.email?.split('@')[0],
          avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture,
        };

        const response = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userData),
        });

        if (response.ok) {
          const result = await response.json();
          console.log('✅ ユーザー登録確認完了:', result);
          setUserRegistered(true);
        } else {
          const errorData = await response.json();
          console.error('❌ ユーザー登録失敗:', errorData);
          setError('ユーザー情報の登録に失敗しました。ページをリロードしてください。');
        }
      } catch (error) {
        console.error('❌ ユーザー登録エラー:', error);
        setError('ユーザー情報の登録に失敗しました。');
      }
    };

    if (user && !isDemoMode) {
      ensureUserInDatabase();
    } else if (isDemoMode) {
      setUserRegistered(true);
    }
  }, [user, isDemoMode]);

  useEffect(() => {
    // Supabaseが未設定の場合はトップページにリダイレクト
    if (!isSupabaseEnabled && !isDemoMode) {
      setError('認証機能が有効になっていません。Supabaseの設定を完了してください。');
      setTimeout(() => router.push('/'), 3000);
      return;
    }
    
    if (!loading && !user) {
      router.push('/login?redirect=/articles/new');
    }
  }, [user, loading, router, isSupabaseEnabled, isDemoMode]);

  const handleSave = async (status = 'published') => {
    if (!title.trim()) {
      setError('タイトルを入力してください');
      return;
    }

    if (!content.trim()) {
      setError('本文を入力してください');
      return;
    }

    if (!userRegistered) {
      setError('ユーザー情報の登録が完了していません。ページをリロードしてください。');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      // スラッグを生成（タイトルから）
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9一-龯ひらがなカタカナ]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 100) + '-' + Date.now();

      console.log('📝 Creating article with status:', status);

      const res = await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          excerpt: content.substring(0, 200),
          thumbnailUrl: thumbnailUrl || null,
          slug,
          authorId: user.id,
          status: status, // 'draft' または 'published'
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '記事の作成に失敗しました');
      }

      const data = await res.json();
      const createdArticle = data.article || data;
      
      if (status === 'draft') {
        // 下書き保存の場合はマイページにリダイレクト
        router.push('/mypage?tab=drafts');
      } else {
        // 公開の場合は記事ページにリダイレクト
        router.push(`/articles/${createdArticle.slug}`);
      }
    } catch (err) {
      setError(err.message);
      setIsSaving(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="edit-loading">
        <p>読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="edit-page">
      <header className="edit-header">
        <div className="edit-header-left">
          {isDemoMode && (
            <span className="demo-badge-inline">🎭 デモ</span>
          )}
          <Link href="/mypage" className="back-link">
            ← マイページに戻る
          </Link>
          <input 
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="title-input"
            placeholder="記事のタイトル"
          />
        </div>
        <div className="edit-header-right">
          {error && <span className="error-message">{error}</span>}
          <button 
            onClick={() => handleSave('draft')} 
            className="draft-button"
            disabled={isSaving}
          >
            {isSaving ? '保存中...' : '📝 下書き保存'}
          </button>
          <button 
            onClick={() => handleSave('published')} 
            className="save-button"
            disabled={isSaving}
          >
            {isSaving ? '公開中...' : '🚀 公開する'}
          </button>
        </div>
      </header>

      <div className="edit-metadata">
        <input 
          type="text"
          value={thumbnailUrl}
          onChange={(e) => setThumbnailUrl(e.target.value)}
          className="thumbnail-input"
          placeholder="サムネイル画像のURL（オプション）"
        />
      </div>

      <main className="editor-layout">
        <div className="editor-pane">
          <div className="editor-toolbar">
            <span>マークダウン編集</span>
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="markdown-editor"
            placeholder="マークダウンで記事を記述...

# 見出し1
## 見出し2
### 見出し3

段落のテキスト

- リスト項目1
- リスト項目2

```
コードブロック
```

> 引用

[リンク](https://example.com)
"
          />
        </div>
        <div className="preview-pane">
          <div className="preview-toolbar">
            <span>プレビュー</span>
          </div>
          <div className="markdown-preview">
            <h1>{title || '記事のタイトル'}</h1>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content || '*ここにプレビューが表示されます*'}
            </ReactMarkdown>
          </div>
        </div>
      </main>
    </div>
  );
}

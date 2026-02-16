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
  const router = useRouter();
  const { isSupabaseEnabled } = useAuth();

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

  const handleSave = async () => {
    if (!title.trim()) {
      setError('タイトルを入力してください');
      return;
    }

    if (!content.trim()) {
      setError('本文を入力してください');
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
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '記事の作成に失敗しました');
      }

      const data = await res.json();
      const createdArticle = data.article || data;
      router.push(`/articles/${createdArticle.slug}`);
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
            onClick={handleSave} 
            className="save-button"
            disabled={isSaving}
          >
            {isSaving ? '公開中...' : '公開する'}
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

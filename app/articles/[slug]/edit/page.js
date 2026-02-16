'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './edit.css';

export default function EditArticlePage({ params }) {
  const resolvedParams = use(params);
  const [article, setArticle] = useState(null);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const router = useRouter();
  const slug = resolvedParams.slug;

  useEffect(() => {
    if (slug) {
      fetch(`/api/articles/${slug}`)
        .then(res => {
          if (!res.ok) {
            throw new Error('記事の読み込みに失敗しました。');
          }
          return res.json();
        })
        .then(data => {
          const articleData = data.article || data;
          setArticle(articleData);
          setTitle(articleData.title || '');
          setContent(articleData.content || '');
          setThumbnailUrl(articleData.thumbnail_url || '');
          setLoading(false);
        })
        .catch(err => {
          setError(err.message);
          setLoading(false);
        });
    }
  }, [slug]);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/articles/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title, 
          content,
          thumbnailUrl: thumbnailUrl 
        }),
      });
      if (!res.ok) {
        throw new Error('記事の更新に失敗しました。');
      }
      const data = await res.json();
      const updatedArticle = data.article || data;
      router.push(`/articles/${updatedArticle.slug}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="edit-loading">
        <p>読み込み中...</p>
      </div>
    );
  }

  if (error && !article) {
    return (
      <div className="edit-error">
        <p>{error}</p>
        <Link href="/">トップページに戻る</Link>
      </div>
    );
  }

  return (
    <div className="edit-page">
      <header className="edit-header">
        <div className="edit-header-left">
          <Link href={`/articles/${slug}`} className="back-link">
            ← 記事に戻る
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
            {isSaving ? '保存中...' : '更新する'}
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
            placeholder="マークダウンで記事を記述..."
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

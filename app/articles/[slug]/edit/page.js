"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function ArticleEditPage({ params }) {
  const router = useRouter();
  const [article, setArticle] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchArticle();
  }, [params.slug]);

  const fetchArticle = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/articles/${params.slug}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "記事の取得に失敗しました");
      }

      setArticle(data.article);
      setTitle(data.article.title);
      setContent(data.article.content);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      setError("タイトルと本文は必須です");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const res = await fetch(`/api/articles/${params.slug}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, content }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "記事の保存に失敗しました");
      }

      router.push(`/articles/${params.slug}`);
    } catch (error) {
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading">記事を読み込み中...</div>;
  if (error && !article) return <div className="error">エラー: {error}</div>;

  return (
    <div className="article-edit">
      <div className="container">
        <nav className="breadcrumb">
          <Link href="/articles">記事一覧</Link> &gt; 
          <Link href={`/articles/${params.slug}`}>{article?.title}</Link> &gt; 
          <span>編集</span>
        </nav>

        <header className="page-header">
          <h1>記事を編集</h1>
          <div className="editor-actions">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="btn-preview"
            >
              {showPreview ? "編集画面" : "プレビュー"}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-save"
            >
              {saving ? "保存中..." : "保存"}
            </button>
          </div>
        </header>

        {error && <div className="error">{error}</div>}

        <div className="editor">
          {!showPreview ? (
            <div className="edit-form">
              <div className="form-group">
                <label htmlFor="title">タイトル</label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="記事タイトルを入力"
                />
              </div>

              <div className="form-group">
                <label htmlFor="content">本文 (Markdown)</label>
                <textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Markdown形式で記事を書いてください..."
                  rows={20}
                />
              </div>
            </div>
          ) : (
            <div className="preview">
              <h2 className="preview-title">{title || "タイトルなし"}</h2>
              <div className="markdown-content">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {content || "*内容がありません*"}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
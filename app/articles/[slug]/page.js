"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function ArticleDetailPage({ params }) {
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) return <div className="loading">記事を読み込み中...</div>;
  if (error) return <div className="error">エラー: {error}</div>;
  if (!article) return <div className="error">記事が見つかりません</div>;

  return (
    <div className="article-detail">
      <div className="container">
        <nav className="breadcrumb">
          <Link href="/articles">← 記事一覧に戻る</Link>
        </nav>

        <article className="article-content">
          <header className="article-header">
            <h1>{article.title}</h1>
            <div className="article-meta">
              <time>作成日: {formatDate(article.created_at)}</time>
              {article.updated_at !== article.created_at && (
                <time>更新日: {formatDate(article.updated_at)}</time>
              )}
            </div>
            <div className="article-actions">
              <Link href={`/articles/${article.slug}/edit`} className="btn-edit">
                記事を編集
              </Link>
            </div>
          </header>

          <div className="markdown-content">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {article.content}
            </ReactMarkdown>
          </div>
        </article>
      </div>
    </div>
  );
}
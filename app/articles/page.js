"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function ArticlesPage() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/articles");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "記事の取得に失敗しました");
      }

      setArticles(data.articles);
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

  return (
    <div className="articles-page">
      <div className="container">
        <header className="page-header">
          <h1>GameStudy ブログ</h1>
          <p>ゲーム開発に関する記事一覧</p>
        </header>

        <div className="articles-grid">
          {articles.length > 0 ? (
            articles.map((article) => (
              <article key={article.id} className="article-card">
                <h2>
                  <Link href={`/articles/${article.slug}`}>
                    {article.title}
                  </Link>
                </h2>
                <time className="article-date">
                  {formatDate(article.updated_at)}
                </time>
                <div className="article-actions">
                  <Link href={`/articles/${article.slug}`} className="btn-read">
                    記事を読む
                  </Link>
                  <Link href={`/articles/${article.slug}/edit`} className="btn-edit">
                    編集
                  </Link>
                </div>
              </article>
            ))
          ) : (
            <p className="no-articles">まだ記事がありません。</p>
          )}
        </div>
      </div>
    </div>
  );
}
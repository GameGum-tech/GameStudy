"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

export default function ArticleListPage() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTag, setActiveTag] = useState(null);
  const [allTags, setAllTags] = useState([]);

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
      
      // 全記事からユニークなタグリストを作成
      const tags = data.articles.flatMap(a => a.tags || []);
      const uniqueTags = Array.from(new Map(tags.map(t => [t.id, t])).values());
      setAllTags(uniqueTags);

    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredArticles = articles
    .filter(article =>
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(article => 
      !activeTag || (article.tags && article.tags.some(t => t.id === activeTag))
    );

  return (
    <div className="note-style-page">


      <main className="container">
        <div className="main-layout">
          <aside className="left-nav">
            <ul>
              <li className="active"><a href="#">すべて</a></li>
              <li><a href="#">投稿企画</a></li>
              <li><a href="#">急上昇</a></li>
              {/* 他のナビゲーション項目 */}
            </ul>
          </aside>

          <div className="content-area">
            <h2 className="section-title">今日の注目記事</h2>
            {loading && <div className="loading">読み込み中...</div>}
            {error && <div className="error">エラー: {error}</div>}
            
            <div className="articles-grid-note">
              {filteredArticles.map(article => (
                <article key={article.id} className="article-card-note">
                  <Link href={`/articles/${article.slug}`}>
                    <div className="card-thumbnail">
                      {article.thumbnail_url ? (
                        <Image
                          src={article.thumbnail_url}
                          alt={article.title}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          style={{ objectFit: 'cover' }}
                        />
                      ) : (
                        <div className="default-card-thumbnail">📄</div>
                      )}
                    </div>
                    <div className="card-content">
                      <h3>{article.title}</h3>
                      <div className="card-meta">
                        <Image
                          src={article.avatar_url || '/default-avatar.png'}
                          alt={article.display_name}
                          width={24}
                          height={24}
                          className="author-avatar"
                        />
                        <span>{article.display_name}</span>
                      </div>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
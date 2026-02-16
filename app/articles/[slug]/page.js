"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// 目次コンポーネント
function TableOfContents({ content }) {
  const [headings, setHeadings] = useState([]);

  useEffect(() => {
    // マークダウンから見出しを抽出
    const lines = content.split('\n');
    const extractedHeadings = lines
      .filter(line => line.match(/^#{1,6}\s/))
      .map((line, index) => {
        const level = line.match(/^#+/)[0].length;
        const text = line.replace(/^#+\s/, '');
        const id = text.toLowerCase().replace(/[^a-z0-9一-龯ひらがなカタカナ]/g, '-');
        return { level, text, id, index };
      });
    setHeadings(extractedHeadings);
  }, [content]);

  if (headings.length === 0) return null;

  return (
    <div className="table-of-contents">
      <h3>📋 目次</h3>
      <ul>
        {headings.map((heading) => (
          <li
            key={heading.index}
            className={`toc-item level-${heading.level}`}
            style={{ marginLeft: `${(heading.level - 1) * 16}px` }}
          >
            <a href={`#${heading.id}`}>{heading.text}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}

// カスタムMarkdownRenderer
function CustomMarkdownRenderer({ content }) {
  const createHeadingRenderer = (level) => {
    return ({ children, ...props }) => {
      const text = children.toString();
      const id = text.toLowerCase().replace(/[^a-z0-9一-龯ひらがなカタカナ]/g, '-');
      const HeadingTag = `h${level}`;
      
      return (
        <HeadingTag id={id} {...props}>
          {children}
        </HeadingTag>
      );
    };
  };

  const components = {
    h1: createHeadingRenderer(1),
    h2: createHeadingRenderer(2),
    h3: createHeadingRenderer(3),
    h4: createHeadingRenderer(4),
    h5: createHeadingRenderer(5),
    h6: createHeadingRenderer(6),
  };

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {content}
    </ReactMarkdown>
  );
}

export default function EnhancedArticleDetailPage({ params }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  useEffect(() => {
    fetchArticle();
  }, [resolvedParams.slug]);

  const fetchArticle = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/articles/${resolvedParams.slug}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "記事の取得に失敗しました");
      }

      setArticle(data.article);
      setLikesCount(data.article.likes_count);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    try {
      const res = await fetch(`/api/articles/${params.slug}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: 1 }),
      });
      const data = await res.json();

      if (res.ok) {
        setLiked(data.liked);
        setLikesCount(data.likesCount);
      }
    } catch (error) {
      console.error("いいね処理エラー:", error);
    }
  };

  const handleBookmark = async () => {
    try {
      const res = await fetch(`/api/articles/${params.slug}/bookmark`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: 1 }),
      });
      const data = await res.json();

      if (res.ok) {
        setBookmarked(data.bookmarked);
      }
    } catch (error) {
      console.error("ブックマーク処理エラー:", error);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: article.title,
        text: article.excerpt,
        url: window.location.href,
      });
    } else {
      // フォールバック: クリップボードにコピー
      navigator.clipboard.writeText(window.location.href);
      alert("URLをクリップボードにコピーしました！");
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
    <div className="enhanced-article-container">
      <aside className="left-sidebar">
        <div className="action-buttons">
          <button onClick={handleLike} className={`action-btn like-btn ${liked ? 'active' : ''}`}>
            <span className="icon">♡</span>
            <span className="count">{likesCount}</span>
          </button>
          <button onClick={handleBookmark} className={`action-btn bookmark-btn ${bookmarked ? 'active' : ''}`}>
            <span className="icon">🔖</span>
          </button>
          <button onClick={handleShare} className="action-btn share-btn">
            <span className="icon">🔗</span>
          </button>
        </div>
      </aside>

      <main className="article-main-content">
        <div className="article-header">
          <div className="thumbnail-container">
            {article.thumbnail_url ? (
              <Image
                src={article.thumbnail_url}
                alt={article.title}
                width={80}
                height={80}
                className="article-thumbnail"
              />
            ) : (
              <div className="default-thumbnail">📄</div>
            )}
          </div>
          <h1>{article.title}</h1>
          <div className="article-meta-top">
            <div className="author-info-top">
              <Image
                src={article.avatar_url || '/default-avatar.png'}
                alt={article.display_name}
                width={24}
                height={24}
                className="author-avatar-small"
              />
              <span>{article.display_name}</span>
            </div>
            <span className="publish-date">公開日: {formatDate(article.created_at)}</span>
          </div>
        </div>

        <div className="article-body">
          <CustomMarkdownRenderer content={article.content} />
        </div>

        <div className="article-footer">
          <div className="tags">
            {article.tags?.map((tag) => (
              <Link href={`/?tag=${tag.name}`} key={tag.id}>
                <span className="tag" style={{ backgroundColor: tag.color }}>
                  #{tag.name}
                </span>
              </Link>
            ))}
          </div>
          <button
            onClick={() => router.push(`/articles/${article.slug}/edit`)}
            className="edit-button"
          >
            記事を編集
          </button>
        </div>
      </main>

      <aside className="right-sidebar">
        <div className="author-profile-card">
          <div className="author-header">
            <Image
              src={article.avatar_url || '/default-avatar.png'}
              alt={article.display_name}
              width={48}
              height={48}
              className="author-avatar-large"
            />
            <div className="author-details">
              <span className="author-name">{article.display_name}</span>
              <span className="author-username">@{article.username}</span>
            </div>
          </div>
          <p className="author-bio">{article.bio}</p>
          <button className="follow-button">フォロー</button>
        </div>
        <TableOfContents content={article.content} />
      </aside>
    </div>
  );
}

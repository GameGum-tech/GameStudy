"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAuth } from "../../../contexts/AuthContext";

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
  const { user } = useAuth();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isAuthor, setIsAuthor] = useState(false);
  const [userRegistered, setUserRegistered] = useState(false);

  // ユーザーをデータベースに登録
  useEffect(() => {
    const ensureUserInDatabase = async () => {
      if (!user) {
        setUserRegistered(true);
        return;
      }
      
      try {
        console.log('🔄 記事詳細ページ: ユーザー登録を確認中...', user.id);
        
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
          console.error('❌ ユーザー登録失敗');
          setUserRegistered(true); // エラーでも続行
        }
      } catch (error) {
        console.error('❌ ユーザー登録エラー:', error);
        setUserRegistered(true); // エラーでも続行
      }
    };

    ensureUserInDatabase();
  }, [user]);

  useEffect(() => {
    fetchArticle();
  }, [resolvedParams.slug]);

  useEffect(() => {
    if (user && article && userRegistered) {
      checkIfAuthor(article);
    }
  }, [user, article, userRegistered]);

  const checkIfAuthor = async (articleData) => {
    if (!user) {
      setIsAuthor(false);
      
      // 下書き記事でログインしていない場合はエラー
      if (articleData.status === 'draft') {
        setError('この記事は下書きです。作成者のみが閲覧できます。');
      }
      return;
    }

    try {
      // ユーザーの記事一覧を取得して、現在の記事が含まれているか確認
      const res = await fetch(`/api/users/${user.id}/articles`);
      if (!res.ok) {
        setIsAuthor(false);
        
        // 下書き記事の場合はエラー
        if (articleData.status === 'draft') {
          setError('この記事は下書きです。作成者のみが閲覧できます。');
        }
        return;
      }

      const data = await res.json();
      const userArticles = data.articles || [];
      
      // 現在の記事がユーザーの記事リストに含まれているか確認
      const isUserArticle = userArticles.some(
        a => a.id === articleData.id || a.slug === articleData.slug
      );
      
      setIsAuthor(isUserArticle);
      console.log('Author check:', { userId: user.id, articleId: articleData.id, isAuthor: isUserArticle });
      
      // 下書き記事で作成者でない場合はエラー
      if (articleData.status === 'draft' && !isUserArticle) {
        setError('この記事は下書きです。作成者のみが閲覧できます。');
      }
    } catch (error) {
      console.error('Author check error:', error);
      setIsAuthor(false);
      
      // 下書き記事の場合はエラー
      if (articleData.status === 'draft') {
        setError('この記事は下書きです。作成者のみが閲覧できます。');
      }
    }
  };

  const fetchArticle = async () => {
    try {
      setLoading(true);
      
      // まず公開記事を取得
      let res = await fetch(`/api/articles/${resolvedParams.slug}`);
      let data = await res.json();

      // 404の場合、ログインユーザーであれば下書きも含めて再取得
      if (!res.ok && res.status === 404 && user) {
        console.log('🔍 記事が見つからないため、下書きも含めて再検索します');
        res = await fetch(`/api/articles/${resolvedParams.slug}?includeDrafts=true`);
        data = await res.json();
      }

      if (!res.ok) {
        throw new Error(data.error || "記事の取得に失敗しました");
      }

      const articleData = data.article;
      
      // 下書き記事の場合、作成者確認が完了するまで表示を保留
      if (articleData.status === 'draft') {
        console.log('📝 下書き記事が見つかりました。作成者確認が必要です。');
        // 一旦記事をセットして、後で作成者チェックで判定
        setArticle(articleData);
        setLikesCount(articleData.likes_count);
      } else {
        setArticle(articleData);
        setLikesCount(articleData.likes_count);
      }
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
          <div className={`thumbnail-container ${article.thumbnail_url ? 'thumbnail-container-with-image' : ''}`}>
            {article.thumbnail_url ? (
              <Image
                src={article.thumbnail_url}
                alt={article.title}
                fill
                priority
                className="article-thumbnail"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                style={{ objectFit: 'cover' }}
              />
            ) : (
              <div className="default-thumbnail">📄</div>
            )}
          </div>
          <div className="article-header-content">
            <h1>{article.title}</h1>
            {article.status === 'draft' && (
              <div className="article-draft-badge">
                📝 下書き（作成者のみ表示中）
              </div>
            )}
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
            <div className="tags">
              {article.tags?.map((tag) => (
                <Link href={`/?tag=${tag.name}`} key={tag.id}>
                  <span className="article-tag">
                    #{tag.name}
                  </span>
                </Link>
              ))}
            </div>
            {isAuthor && (
              <button
                onClick={() => router.push(`/articles/${article.slug}/edit`)}
                className="edit-button"
              >
                記事を編集
              </button>
            )}
          </div>
        </div>

        <div className="article-body">
          <CustomMarkdownRenderer content={article.content} />
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

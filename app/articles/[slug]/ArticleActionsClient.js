"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../contexts/AuthContext";

const FALLBACK_USER_ID = 1;

const isUuid = (value) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value || "");

const useInternalUserId = () => {
  const { user, isDemoMode } = useAuth();
  const [internalUserId, setInternalUserId] = useState(isDemoMode ? FALLBACK_USER_ID : null);

  useEffect(() => {
    let isMounted = true;

    const resolveInternalId = async () => {
      if (!user) {
        if (isMounted) setInternalUserId(isDemoMode ? FALLBACK_USER_ID : null);
        return;
      }

      if (isDemoMode) {
        if (isMounted) setInternalUserId(FALLBACK_USER_ID);
        return;
      }

      try {
        const res = await fetch(`/api/users?auth_uid=${encodeURIComponent(user.id)}`);
        if (!res.ok) {
          if (isMounted) setInternalUserId(null);
          return;
        }

        const data = await res.json();
        if (isMounted) {
          setInternalUserId(data.user?.id ?? null);
        }
      } catch (error) {
        console.error("[ERR] Failed to resolve internal user id:", error);
        if (isMounted) setInternalUserId(null);
      }
    };

    resolveInternalId();

    return () => {
      isMounted = false;
    };
  }, [user, isDemoMode]);

  return internalUserId;
};

export function ArticleActionsClient({ slug, title, excerpt, initialLikesCount = 0 }) {
  const internalUserId = useInternalUserId();
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const userIdForAction = useMemo(() => internalUserId ?? null, [internalUserId]);

  const handleLike = async () => {
    if (!userIdForAction) return;

    try {
      const res = await fetch(`/api/articles/${slug}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userIdForAction }),
      });

      const data = await res.json();
      if (res.ok) {
        setLiked(Boolean(data.liked));
        setLikesCount(Number(data.likesCount ?? likesCount));
      }
    } catch (error) {
      console.error("いいね処理エラー:", error);
    }
  };

  const handleBookmark = async () => {
    if (!userIdForAction) return;

    try {
      const res = await fetch(`/api/articles/${slug}/bookmark`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userIdForAction }),
      });

      const data = await res.json();
      if (res.ok) {
        setBookmarked(Boolean(data.bookmarked));
      }
    } catch (error) {
      console.error("ブックマーク処理エラー:", error);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title,
        text: excerpt,
        url: window.location.href,
      });
      return;
    }

    await navigator.clipboard.writeText(window.location.href);
    alert("URLをクリップボードにコピーしました！");
  };

  return (
    <aside className="left-sidebar">
      <div className="action-buttons">
        <button
          onClick={handleLike}
          className={`action-btn like-btn ${liked ? "active" : ""}`}
          disabled={!userIdForAction}
          aria-label="この記事にいいね"
          title={userIdForAction ? "この記事にいいね" : "ログインするといいねできます"}
        >
          <span className="icon material-symbols-outlined" aria-hidden="true">
            favorite
          </span>
          <span className="count">{likesCount}</span>
        </button>
        <button
          onClick={handleBookmark}
          className={`action-btn bookmark-btn ${bookmarked ? "active" : ""}`}
          disabled={!userIdForAction}
          aria-label="この記事をブックマーク"
          title={userIdForAction ? "この記事をブックマーク" : "ログインするとブックマークできます"}
        >
          <span className="icon material-symbols-outlined" aria-hidden="true">
            bookmark
          </span>
        </button>
        <button onClick={handleShare} className="action-btn share-btn" aria-label="この記事を共有">
          <span className="icon material-symbols-outlined" aria-hidden="true">
            share
          </span>
        </button>
      </div>
    </aside>
  );
}

export function ArticleAuthorControlsClient({ articleSlug }) {
  const { user } = useAuth();
  const router = useRouter();
  const [isAuthor, setIsAuthor] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const checkAuthor = async () => {
      if (!user?.id || !isUuid(user.id)) {
        if (isMounted) setIsAuthor(false);
        return;
      }

      try {
        const res = await fetch(`/api/users/${user.id}/articles`);
        if (!res.ok) {
          if (isMounted) setIsAuthor(false);
          return;
        }

        const data = await res.json();
        const isUserArticle = (data.articles || []).some((article) => article.slug === articleSlug);
        if (isMounted) setIsAuthor(isUserArticle);
      } catch (error) {
        console.error("Author check error:", error);
        if (isMounted) setIsAuthor(false);
      }
    };

    checkAuthor();

    return () => {
      isMounted = false;
    };
  }, [articleSlug, user?.id]);

  if (!isAuthor) return null;

  return (
    <button onClick={() => router.push(`/articles/${articleSlug}/edit`)} className="edit-button">
      記事を編集
    </button>
  );
}

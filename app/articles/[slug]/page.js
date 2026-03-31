import { unstable_cache } from "next/cache";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { pool } from "../../../lib/db";
import { ArticleActionsClient, ArticleAuthorControlsClient } from "./ArticleActionsClient";

const REVALIDATE_SECONDS = 3600;

export const revalidate = 3600;

const normalizeSlug = (slug) => {
  if (typeof slug !== "string") return "";
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
};

const slugify = (text) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9一-龯ぁ-んァ-ヶー]+/g, "-")
    .replace(/^-+|-+$/g, "");

const getTextFromNode = (node) => {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(getTextFromNode).join("");
  if (node?.props?.children) return getTextFromNode(node.props.children);
  return "";
};

const extractHeadings = (content) =>
  content
    .split("\n")
    .map((line) => line.match(/^(#{1,6})\s+(.+)$/))
    .filter(Boolean)
    .map((match, index) => ({
      level: match[1].length,
      text: match[2].trim(),
      id: slugify(match[2]),
      index,
    }));

const getPublishedArticleBySlug = unstable_cache(
  async (slug) => {
    const client = await pool.connect();

    try {
      const result = await client.query(
        `SELECT
          a.*,
          u.username, u.display_name, u.avatar_url, u.bio,
          ARRAY_AGG(
            json_build_object('id', t.id, 'name', t.name, 'color', t.color)
          ) FILTER (WHERE t.id IS NOT NULL) as tags
        FROM articles a
        LEFT JOIN users u ON a.author_id = u.id
        LEFT JOIN article_tags at ON a.id = at.article_id
        LEFT JOIN tags t ON at.tag_id = t.id
        WHERE a.slug = $1 AND a.published = true
        GROUP BY a.id, u.username, u.display_name, u.avatar_url, u.bio`,
        [slug]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return {
        ...result.rows[0],
        tags: result.rows[0].tags || [],
      };
    } finally {
      client.release();
    }
  },
  ["published-article-by-slug"],
  { revalidate: REVALIDATE_SECONDS }
);

const getPublishedSlugs = unstable_cache(
  async () => {
    const client = await pool.connect();

    try {
      const result = await client.query(
        "SELECT slug FROM articles WHERE published = true ORDER BY updated_at DESC LIMIT 500"
      );
      return result.rows.map((row) => row.slug).filter(Boolean);
    } finally {
      client.release();
    }
  },
  ["published-article-slugs"],
  { revalidate: REVALIDATE_SECONDS }
);

export async function generateStaticParams() {
  try {
    const slugs = await getPublishedSlugs();
    return slugs.map((slug) => ({ slug }));
  } catch (error) {
    console.warn("[WARN] generateStaticParams failed:", error);
    return [];
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const normalizedSlug = normalizeSlug(slug);
  const article = await getPublishedArticleBySlug(normalizedSlug);

  if (!article) {
    return {
      title: "記事が見つかりません | ゲームスタディ",
      description: "指定された記事は見つかりませんでした。",
    };
  }

  return {
    title: `${article.title} | ゲームスタディ`,
    description: article.excerpt || article.title,
    alternates: {
      canonical: `/articles/${article.slug}`,
    },
    openGraph: {
      title: article.title,
      description: article.excerpt || article.title,
      images: article.thumbnail_url ? [article.thumbnail_url] : [],
      type: "article",
    },
  };
}

function TableOfContents({ content }) {
  const headings = extractHeadings(content || "");

  if (headings.length === 0) return null;

  return (
    <div className="table-of-contents">
      <h3>
        <span className="material-symbols-outlined" aria-hidden="true">toc</span>
        目次
      </h3>
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
      const text = getTextFromNode(children);
      const id = slugify(text);
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

export default async function EnhancedArticleDetailPage({ params }) {
  const { slug } = await params;
  const normalizedSlug = normalizeSlug(slug);
  const article = await getPublishedArticleBySlug(normalizedSlug);

  if (!article) {
    notFound();
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="enhanced-article-container">
      <ArticleActionsClient
        slug={article.slug}
        title={article.title}
        excerpt={article.excerpt}
        initialLikesCount={article.likes_count || 0}
      />

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
              <div className="default-thumbnail">
                <span className="material-symbols-outlined" aria-hidden="true">article</span>
              </div>
            )}
          </div>
          <div className="article-header-content">
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
            <div className="tags">
              {article.tags?.map((tag) => (
                <Link href={`/?tag=${tag.name}`} key={tag.id}>
                  <span className="article-tag">
                    #{tag.name}
                  </span>
                </Link>
              ))}
            </div>
            <ArticleAuthorControlsClient articleSlug={article.slug} />
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

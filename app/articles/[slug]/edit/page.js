'use client';

import { useState, useEffect, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from '../../../../contexts/AuthContext';
import './edit.css';

export default function EditArticlePage({ params }) {
  const resolvedParams = use(params);
  const { user, loading: authLoading } = useAuth();
  const [article, setArticle] = useState(null);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadedImagePaths, setUploadedImagePaths] = useState([]);
  const [isAuthor, setIsAuthor] = useState(false);
  const [userRegistered, setUserRegistered] = useState(false);
  const editorRef = useRef(null);
  const imageInputRef = useRef(null);
  const cursorPositionRef = useRef(null);

  const router = useRouter();
  const slug = resolvedParams.slug;

  // ユーザーをデータベースに登録
  useEffect(() => {
    const ensureUserInDatabase = async () => {
      if (!user) return;
      
      try {
        console.log('🔄 編集ページ: ユーザー登録を確認中...', user.id);
        
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
          const errorData = await response.json();
          console.error('❌ ユーザー登録失敗:', errorData);
          setError('ユーザー情報の登録に失敗しました。ページをリロードしてください。');
        }
      } catch (error) {
        console.error('❌ ユーザー登録エラー:', error);
        setError('ユーザー情報の登録に失敗しました。');
      }
    };

    if (user) {
      ensureUserInDatabase();
    }
  }, [user]);

  // タグ一覧を取得
  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      const res = await fetch('/api/tags');
      const data = await res.json();
      if (res.ok) {
        setAvailableTags(data.tags || []);
      }
    } catch (error) {
      console.error('タグの取得に失敗:', error);
    }
  };

  // 認証チェック
  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/login?redirect=/articles/${slug}/edit`);
    }
  }, [user, authLoading, router, slug]);

  // 記事データの取得と権限チェック
  useEffect(() => {
    if (slug && user && userRegistered) {
      fetchArticleAndCheckAuthor();
    }
  }, [slug, user, userRegistered]);

  const fetchArticleAndCheckAuthor = async () => {
    try {
      // 記事を取得（下書きも含める）
      const articleRes = await fetch(`/api/articles/${slug}?includeDrafts=true`);
      if (!articleRes.ok) {
        throw new Error('記事の読み込みに失敗しました。');
      }
      const articleData = await articleRes.json();
      const article = articleData.article || articleData;
      
      setArticle(article);
      setTitle(article.title || '');
      setContent(article.content || '');
      setThumbnailUrl(article.thumbnail_url || '');
      setSelectedTags(article.tags || []); // 既存のタグを設定
      
      // ユーザーの記事一覧を取得して作成者チェック
      console.log('🔍 Checking if user is author:', { userId: user.id, articleId: article.id });
      const userArticlesRes = await fetch(`/api/users/${user.id}/articles`);
      
      if (userArticlesRes.ok) {
        const userArticlesData = await userArticlesRes.json();
        const userArticles = userArticlesData.articles || [];
        
        // 現在の記事がユーザーの記事リストに含まれているか確認
        const userIsAuthor = userArticles.some(
          a => a.id === article.id || a.slug === article.slug
        );
        
        console.log('✅ Author check result:', userIsAuthor);
        setIsAuthor(userIsAuthor);
        
        if (!userIsAuthor) {
          setError('この記事を編集する権限がありません。');
        }
      } else {
        // APIエラーの場合は権限なしとする
        console.error('❌ Failed to fetch user articles');
        setIsAuthor(false);
        setError('作成者の確認に失敗しました。ページをリロードしてください。');
      }
      
      setLoading(false);
    } catch (err) {
      console.error('❌ Error:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const handleSave = async (status = undefined) => {
    if (!isAuthor) {
      setError('この記事を編集する権限がありません。');
      return;
    }

    if (!userRegistered) {
      setError('ユーザー情報の登録が完了していません。ページをリロードしてください。');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      console.log('💾 Saving article:', { slug, userId: user.id, status });
      
      const bodyData = { 
        title, 
        content,
        excerpt: content.substring(0, 200),
        thumbnailUrl: thumbnailUrl,
        authorId: user.id,  // 作成者IDを送信（UUID）
        tags: selectedTags.map(t => t.id), // タグIDの配列を送信
        uploadedImagePaths,
      };
      
      // statusが指定されている場合のみ追加
      if (status !== undefined) {
        bodyData.status = status;
      }
      
      const res = await fetch(`/api/articles/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData),
      });
      
      if (!res.ok) {
        const data = await res.json();
        console.error('❌ Save failed:', data);
        throw new Error(data.error || '記事の更新に失敗しました。');
      }
      
      const data = await res.json();
      console.log('✅ Article saved successfully');
      const updatedArticle = data.article || data;
      
      if (status === 'draft') {
        // 下書きに戻した場合はマイページへ
        router.push('/mypage?tab=drafts');
      } else {
        // 更新または公開の場合は記事ページへ
        router.push(`/articles/${updatedArticle.slug}`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTagToggle = (tag) => {
    if (selectedTags.find(t => t.id === tag.id)) {
      setSelectedTags(selectedTags.filter(t => t.id !== tag.id));
    } else if (selectedTags.length < 5) {
      setSelectedTags([...selectedTags, tag]);
      setTagInput('');
      setShowTagSuggestions(false);
    } else {
      setError('タグは最大5つまで選択できます');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleTagInputChange = (e) => {
    const value = e.target.value;
    setTagInput(value);
    
    if (value.startsWith('#')) {
      setShowTagSuggestions(true);
    } else {
      setShowTagSuggestions(false);
    }
  };

  const handleTagInputKeyDown = async (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      const tagName = tagInput.replace(/^#/, '').trim();
      
      if (!tagName) return;
      
      if (selectedTags.length >= 5) {
        setError('タグは最大5つまで選択できます');
        setTimeout(() => setError(null), 3000);
        return;
      }

      const existingTag = availableTags.find(
        t => t.name.toLowerCase() === tagName.toLowerCase()
      );

      if (existingTag) {
        if (!selectedTags.find(t => t.id === existingTag.id)) {
          setSelectedTags([...selectedTags, existingTag]);
        }
        setTagInput('');
        setShowTagSuggestions(false);
      } else {
        try {
          const res = await fetch('/api/tags', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: tagName }),
          });

          const data = await res.json();
          if (res.ok) {
            const newTag = data.tag;
            if (!availableTags.find(t => t.id === newTag.id)) {
              setAvailableTags([...availableTags, { ...newTag, article_count: 0 }]);
            }
            if (!selectedTags.find(t => t.id === newTag.id)) {
              setSelectedTags([...selectedTags, newTag]);
            }
            setTagInput('');
            setShowTagSuggestions(false);
          }
        } catch (error) {
          console.error('タグの作成に失敗:', error);
        }
      }
    } else if (e.key === 'Backspace' && !tagInput && selectedTags.length > 0) {
      setSelectedTags(selectedTags.slice(0, -1));
    }
  };

  const removeTag = (tagId) => {
    setSelectedTags(selectedTags.filter(t => t.id !== tagId));
  };

  const updateCursorPosition = () => {
    if (!editorRef.current) return;
    cursorPositionRef.current = editorRef.current.selectionStart;
  };

  const insertMarkdownImage = (markdown) => {
    const textarea = editorRef.current;

    if (!textarea || document.activeElement !== textarea || cursorPositionRef.current === null) {
      setContent((prev) => `${prev}${prev.endsWith('\n') || prev.length === 0 ? '' : '\n'}${markdown}\n`);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const imageLine = `\n${markdown}\n`;
    const nextContent = `${content.slice(0, start)}${imageLine}${content.slice(end)}`;
    const nextCursor = start + imageLine.length;

    setContent(nextContent);

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(nextCursor, nextCursor);
      cursorPositionRef.current = nextCursor;
    });
  };

  const handleOpenImagePicker = () => {
    imageInputRef.current?.click();
  };

  const handleImageSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!user?.id) {
      setError('画像アップロードにはログインが必要です。');
      e.target.value = '';
      return;
    }

    setIsUploadingImage(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', user.id);

      const res = await fetch('/api/images/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || '画像のアップロードに失敗しました。');
      }

      if (data.path) {
        setUploadedImagePaths((prev) => (prev.includes(data.path) ? prev : [...prev, data.path]));
      }

      insertMarkdownImage(data.markdown || `![](${data.url})`);
    } catch (err) {
      console.error('画像挿入エラー:', err);
      setError(err.message || '画像のアップロードに失敗しました。');
    } finally {
      setIsUploadingImage(false);
      e.target.value = '';
    }
  };

  const filteredSuggestions = availableTags.filter(tag => {
    const query = tagInput.replace(/^#/, '').toLowerCase();
    return tag.name.toLowerCase().includes(query) && !selectedTags.find(t => t.id === tag.id);
  });

  if (authLoading || loading) {
    return (
      <div className="edit-loading">
        <p>読み込み中...</p>
      </div>
    );
  }

  if (!user) {
    return null; // リダイレクト中
  }

  if (error && !isAuthor) {
    return (
      <div className="edit-error">
        <p>{error}</p>
        <Link href={`/articles/${slug}`}>記事に戻る</Link>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="edit-error">
        <p>記事が見つかりません</p>
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
          {article?.status === 'draft' ? (
            <>
              <button 
                onClick={() => handleSave('draft')} 
                className="draft-button"
                disabled={isSaving}
              >
                {isSaving ? '保存中...' : '📝 下書き保存'}
              </button>
              <button 
                onClick={() => handleSave('published')} 
                className="save-button"
                disabled={isSaving}
              >
                {isSaving ? '公開中...' : '🚀 公開する'}
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => handleSave('draft')} 
                className="draft-button"
                disabled={isSaving}
              >
                {isSaving ? '保存中...' : '📝 下書きに戻す'}
              </button>
              <button 
                onClick={() => handleSave()} 
                className="save-button"
                disabled={isSaving}
              >
                {isSaving ? '更新中...' : '✓ 更新する'}
              </button>
            </>
          )}
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
        
        {/* タグ選択UI */}
        <div className="tag-selection-area-new">
          <label className="tag-input-label">🏷️ タグを追加（最大5つ） - 「#」で候補を表示</label>
          
          <div className="tag-input-wrapper">
            {selectedTags.map(tag => (
              <span 
                key={tag.id} 
                className="selected-tag-chip"
              >
                #{tag.name}
                <button
                  type="button"
                  className="remove-tag-btn"
                  onClick={() => removeTag(tag.id)}
                >
                  ×
                </button>
              </span>
            ))}
            
            <input
              type="text"
              value={tagInput}
              onChange={handleTagInputChange}
              onKeyDown={handleTagInputKeyDown}
              onFocus={() => { if (tagInput.startsWith('#')) setShowTagSuggestions(true); }}
              onBlur={() => setTimeout(() => setShowTagSuggestions(false), 200)}
              placeholder={selectedTags.length === 0 ? "#タグ名を入力..." : ""}
              className="tag-text-input"
              disabled={selectedTags.length >= 5}
            />
          </div>
          
          <div className="tag-count-indicator">{selectedTags.length}/5 タグ選択中</div>
          
          {showTagSuggestions && tagInput.startsWith('#') && (
            <div className="tag-suggestions-dropdown">
              {filteredSuggestions.length > 0 ? (
                filteredSuggestions.slice(0, 10).map(tag => (
                  <div
                    key={tag.id}
                    className="tag-suggestion-item"
                    onMouseDown={() => handleTagToggle(tag)}
                  >
                    <span className="tag-suggestion-name">#{tag.name}</span>
                    <span className="tag-suggestion-count">
                      {tag.article_count || 0} 件の記事
                    </span>
                  </div>
                ))
              ) : (
                <div className="tag-suggestion-item no-results">
                  <span className="tag-suggestion-name">
                    Enterで新しいタグ「{tagInput.replace(/^#/, '')}」を作成
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <main className="editor-layout">
        <div className="editor-pane">
          <div className="editor-toolbar">
            <span>マークダウン編集</span>
            <button
              type="button"
              className="image-insert-button"
              onClick={handleOpenImagePicker}
              disabled={isUploadingImage || isSaving}
              title="画像を挿入"
            >
              {isUploadingImage ? 'アップロード中...' : '🖼️ 画像'}
            </button>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="image-upload-input"
              onChange={handleImageSelected}
            />
          </div>
          <textarea
            ref={editorRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onClick={updateCursorPosition}
            onKeyUp={updateCursorPosition}
            onSelect={updateCursorPosition}
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

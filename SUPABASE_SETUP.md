# GameStudy - Supabase認証統合ガイド

## 概要
このアプリケーションは、Supabaseを使用した認証機能を統合しています。Google、GitHub、メールによるサインイン/サインアップに対応しています。

## セットアップ手順

### 1. Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com)にアクセスし、新しいプロジェクトを作成します。
2. プロジェクトが作成されたら、以下の情報を確認します：
   - Project URL (例: `https://xxxxx.supabase.co`)
   - Anon Key (公開用APIキー)

### 2. 環境変数の設定

`.env.local`ファイルを作成し、以下の環境変数を設定します：

```bash
# Supabase設定
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# データベース接続（既存のPostgreSQL）
DATABASE_URL=postgresql://user:password@db:5432/gamestudy
```

### 3. Supabaseコンソールでの認証設定

#### 3.1 Google認証の設定

1. Supabaseダッシュボード → Authentication → Providers → Google
2. [Google Cloud Console](https://console.cloud.google.com/)でOAuthクライアントIDを作成：
   - 認証済みのリダイレクトURIに以下を追加：
     - `https://your-project-ref.supabase.co/auth/v1/callback`
3. Client IDとClient Secretを取得し、Supabaseに設定

#### 3.2 GitHub認証の設定

1. Supabaseダッシュボード → Authentication → Providers → GitHub
2. [GitHub Developer Settings](https://github.com/settings/developers)でOAuth Appを作成：
   - Authorization callback URLに以下を設定：
     - `https://your-project-ref.supabase.co/auth/v1/callback`
3. Client IDとClient Secretを取得し、Supabaseに設定

#### 3.3 メール認証の設定

1. Supabaseダッシュボード → Authentication → Providers → Email
2. デフォルトで有効になっています
3. 必要に応じて、メール確認を有効/無効に設定

#### 3.4 サイトURLの設定

1. Supabaseダッシュボード → Authentication → URL Configuration
2. Site URLを設定：
   - 開発環境: `http://localhost:3000`
   - 本番環境: あなたのドメイン
3. Redirect URLsに以下を追加：
   - `http://localhost:3000/auth/callback`
   - `https://your-domain.com/auth/callback`

### 4. パッケージのインストール

```bash
# コンテナ内で実行
docker exec -it gamestudy-web-1 npm install
```

または、Dockerfileを再ビルド：

```bash
sudo docker compose down
sudo docker compose up --build -d
```

### 5. アプリケーションの起動

```bash
sudo docker compose up -d
```

## 主な機能

### 認証機能
- ✅ Googleアカウントでサインイン/サインアップ
- ✅ GitHubアカウントでサインイン/サインアップ
- ✅ メールアドレスでサインイン/サインアップ
- ✅ ログアウト機能

### ユーザー機能
- ✅ ヘッダーにユーザーアイコン表示
- ✅ ドロップダウンメニューでユーザー情報表示
- ✅ マイページで自分の記事を管理
- ✅ 記事の作成・編集・削除

## 主要なページとコンポーネント

### ページ
- `/login` - ログインページ
- `/signup` - サインアップページ
- `/auth/callback` - 認証コールバック
- `/mypage` - マイページ（認証必須）
- `/articles/new` - 記事作成ページ（認証必須）
- `/articles/[slug]/edit` - 記事編集ページ（認証必須）

### コンポーネント
- `contexts/AuthContext.js` - 認証コンテキスト（ユーザー状態管理）
- `app/components/Header.js` - ヘッダーコンポーネント（ログイン状態に応じて表示変更）
- `app/components/Providers.js` - クライアントサイドプロバイダー

## トラブルシューティング

### 認証が機能しない場合

1. 環境変数が正しく設定されているか確認
2. Supabaseのプロジェクト設定を確認
3. ブラウザのコンソールでエラーメッセージを確認

### Google/GitHub認証が失敗する場合

1. OAuthクライアントの設定を確認
2. リダイレクトURIが正しく設定されているか確認
3. Supabaseダッシュボードで認証プロバイダーが有効になっているか確認

### 画像が表示されない場合

`next.config.js`に以下のドメインを追加：

```javascript
module.exports = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'api.dicebear.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' }, // Google
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' }, // GitHub
    ],
  },
};
```

## 今後の拡張

- [ ] SupabaseのPostgreSQLデータベースに完全移行
- [ ] ユーザープロフィール編集機能
- [ ] フォロー/フォロワー機能
- [ ] 記事へのコメント機能
- [ ] 通知機能
- [ ] メール認証の確認フロー

## 参考リンク

- [Supabase公式ドキュメント](https://supabase.com/docs)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Next.js with Supabase](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)

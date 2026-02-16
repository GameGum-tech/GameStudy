# GameStudy - Supabase認証統合ガイド

## 概要
このアプリケーションは、Supabaseを使用した認証機能を統合しています。Google、GitHub、メールによるサインイン/サインアップに対応しています。

---

## 🚀 クイックスタート

### 1. Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com)にアクセスし、新しいプロジェクトを作成
2. プロジェクトダッシュボードで以下の情報を取得：
   - **Project URL**: Settings → API → Project URL
   - **Anon Key**: Settings → API → anon public (公開用APIキー)

### 2. ローカル環境の設定

`.env.local`ファイルを作成（既に作成済みの場合はスキップ）：

```bash
# コピーして編集
cp .env.local.example .env.local
```

`.env.local`を編集：
```bash
# Supabase設定（あなたのプロジェクトの値に置き換えてください）
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# データベース接続（Docker環境）
DATABASE_URL=postgresql://user:password@db:5432/gamestudy
```

### 3. Supabaseの認証設定

#### 🔵 Google認証の設定

1. Supabaseダッシュボード → **Authentication** → **Providers** → **Google**
2. [Google Cloud Console](https://console.cloud.google.com/) へ移動
3. **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth client ID**
4. アプリケーションタイプ: **Web application**
5. **認証済みのリダイレクトURI** に追加：
   ```
   https://your-project.supabase.co/auth/v1/callback
   ```
6. Client IDとClient Secretをコピーし、Supabaseに設定
7. **Save** をクリック

#### 🔶 GitHub認証の設定

1. Supabaseダッシュボード → **Authentication** → **Providers** → **GitHub**
2. [GitHub Developer Settings](https://github.com/settings/developers) へ移動
3. **New OAuth App** をクリック
4. **Authorization callback URL** に設定：
   ```
   https://your-project.supabase.co/auth/v1/callback
   ```
5. Client IDとClient Secretをコピーし、Supabaseに設定
6. **Save** をクリック

#### ✉️ メール認証の設定

1. Supabaseダッシュボード → **Authentication** → **Providers** → **Email**
2. デフォルトで有効（必要に応じてメール確認を有効/無効に設定）

#### 🌐 サイトURLとリダイレクトURLの設定

1. Supabaseダッシュボード → **Authentication** → **URL Configuration**
2. **Site URL** を設定：
   - 開発環境: `http://localhost:3000`
   - 本番環境: `https://your-domain.vercel.app`
3. **Redirect URLs** に追加：
   ```
   http://localhost:3000/auth/callback
   https://your-domain.vercel.app/auth/callback
   ```

---

## 📦 Vercelへのデプロイ

### ステップ1: Vercelプロジェクトの作成

1. [Vercel](https://vercel.com) にログイン
2. **New Project** → GitHubリポジトリを選択
3. プロジェクト名を入力

### ステップ2: 環境変数の設定

Vercelダッシュボードで **Settings** → **Environment Variables** に移動し、以下を追加：

```bash
# Supabase設定
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# データベース接続（Supabase PostgreSQL - Connection pooling推奨）
DATABASE_URL=postgresql://postgres.your-project:[PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres
```

**⚠️ 重要**: 
- 本番環境では`DATABASE_URL`にSupabase PostgreSQL **Connection pooling** の接続文字列を使用してください
- Supabaseダッシュボード → **Settings** → **Database** → **Connection string** → **Connection pooling** → **Session mode**
- ❌ 直接接続（`db.xxx.supabase.co:5432`）は使用しないでください（Vercelで接続エラーが発生します）
- ✅ Connection pooling（`aws-0-xxx.pooler.supabase.com:6543`）を使用してください
- パスワードを忘れた場合: Supabase Dashboard → **Settings** → **Database** → **Reset Database Password**

### ステップ3: デプロイ

```bash
# コードをプッシュ
git add .
git commit -m "Add Supabase integration and fixes"
git push origin main
```

Vercelが自動的にビルド・デプロイを開始します。

### ステップ4: Supabaseのリダイレクトurl を更新

デプロイ完了後、VercelのURLを取得し、Supabaseの設定を更新：

1. Supabaseダッシュボード → **Authentication** → **URL Configuration**
2. **Site URL** を本番環境のURLに更新: `https://your-app.vercel.app`
3. **Redirect URLs** に追加: `https://your-app.vercel.app/auth/callback`

---

## ✅ 動作確認

1. デプロイされたサイトにアクセス
2. **ログイン** または **会員登録** をクリック
3. Google / GitHub / メール でサインイン
4. ユーザーアイコンが表示されることを確認
5. **マイページ** で記事管理ができることを確認

---

## 🎭 デモモード

Supabaseが設定されていない場合、アプリは自動的にデモモードで動作します：
- ヘッダーに「🎭 デモモードでログイン」ボタンが表示
- ローカルストレージを使用した擬似ログイン
- 記事の作成・編集が可能（ただし永続化されません）

---
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

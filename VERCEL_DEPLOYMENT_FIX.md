# Vercelデプロイ時のエラー修正手順

## 修正内容

### 1. データベース接続の修正 ✅

`lib/db.js`を修正し、Vercel環境で`DATABASE_URL`を使用できるようにしました。

```javascript
// DATABASE_URLが設定されている場合（Vercel等）はそれを使用
// そうでない場合は個別の環境変数を使用（Docker等）
```

---

## Vercel環境変数の設定

Vercelダッシュボードで以下の環境変数を設定してください：

### 必須環境変数

```bash
# Supabase設定
NEXT_PUBLIC_SUPABASE_URL=https://rdhibzwnkfgrvlvjgpwm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# データベース接続
DATABASE_URL=postgresql://postgres:[YOUR_PASSWORD]@db.rdhibzwnkfgrvlvjgpwm.supabase.co:5432/postgres
```

### DATABASE_URLの取得方法

1. [Supabase Dashboard](https://supabase.com/dashboard)にログイン
2. プロジェクト（rdhibzwnkfgrvlvjgpwm）を選択
3. **Settings** → **Database** をクリック
4. **Connection string** タブ → **URI** を選択
5. `[YOUR_PASSWORD]`を実際のデータベースパスワードに置き換え
6. コピーしたURLをVercelの`DATABASE_URL`に設定

---

## Vercel環境変数の設定手順

1. [Vercel Dashboard](https://vercel.com/dashboard)にログイン
2. デプロイしたプロジェクト（game-study-1v4r）を選択
3. **Settings** → **Environment Variables** をクリック
4. 上記の環境変数を追加：
   - Variable Name: `NEXT_PUBLIC_SUPABASE_URL`
   - Value: `https://rdhibzwnkfgrvlvjgpwm.supabase.co`
   - Environment: **Production**, **Preview**, **Development** すべてチェック
5. **Add** をクリックして追加
6. 同様に他の環境変数も追加

---

## 再デプロイ

### 方法1: コードをプッシュして自動デプロイ

```bash
git add .
git commit -m "Fix database connection for Vercel deployment"
git push origin main
```

### 方法2: Vercel Dashboardから手動デプロイ

1. Vercel Dashboard → プロジェクトページ
2. **Deployments** タブ → 最新のデプロイを選択
3. **Redeploy** ボタンをクリック

---

## エラーの原因と解決

### 1. `/api/articles` 500エラー ✅ 修正済み
**原因**: Vercel環境でデータベース接続文字列が認識されていなかった  
**解決**: `lib/db.js`を修正し、`DATABASE_URL`を使用するように変更

### 2. dicebear SVG 400エラー ⚠️ 軽微
**原因**: dicebear APIの一時的な問題、またはデモモードでの画像生成  
**解決**: Supabase認証設定後、実際のユーザーアバターが使用されるため解決

### 3. favicon 404エラー ⚠️ 軽微
**原因**: faviconファイルが存在しない  
**解決**: 後ほど`public/favicon.ico`を追加予定

---

## 確認事項

デプロイ後、以下を確認してください：

1. ✅ サイトが正常に表示される
2. ✅ `/api/articles`が動作する（記事一覧が表示される）
3. ✅ Supabase認証が動作する（ログインできる）
4. ⚠️ アバター画像が表示される（認証後）

---

## 次のステップ

1. **Supabase OAuth設定**（まだの場合）
   - Google OAuth Client IDとSecretを設定
   - GitHub OAuth Appを設定
   - Site URLとRedirect URLsを設定

2. **Vercel環境変数の確認**
   - すべての環境変数が正しく設定されているか確認
   - 特に`DATABASE_URL`のパスワード部分が正しいか確認

3. **再デプロイ**
   - コードの変更をプッシュ
   - Vercelが自動的にビルド・デプロイ

4. **動作確認**
   - デプロイされたサイトでログイン
   - 記事の作成・閲覧ができるか確認

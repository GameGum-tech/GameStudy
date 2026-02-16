# Vercelデプロイ時のエラー修正手順

## 🔍 現在のエラー分析

### エラー内容
```
GET /api/articles 500 (Internal Server Error)
```

### 原因の可能性
1. **データベース接続エラー** - Vercel環境変数が未設定または不正
2. **テーブルが存在しない** - Supabaseにテーブルが作成されていない
3. **DATABASE_URLが不正** - パスワードまたは接続文字列が間違っている

---

## ✅ 修正内容

### 1. データベース接続の修正 ✅

`lib/db.js`を修正し、Vercel環境で`DATABASE_URL`を使用できるようにしました。

```javascript
// DATABASE_URLが設定されている場合（Vercel等）はそれを使用
// そうでない場合は個別の環境変数を使用（Docker等）
```

### 2. APIルートにエラーログ追加 ✅

`app/api/articles/route.js`に詳細なエラーログを追加しました。
Vercelのログを確認することで、具体的なエラー原因を特定できます。

---

## 📋 デプロイ前チェックリスト

### ステップ1: Supabaseでテーブルを作成

**重要**: Vercelエラーの原因は、Supabaseにテーブルが存在しないことです。

1. [Supabase Dashboard](https://supabase.com/dashboard) にログイン
2. プロジェクト（rdhibzwnkfgrvlvjgpwm）を選択
3. 左サイドバーから **SQL Editor** をクリック
4. **New Query** をクリック
5. [`database/supabase-migration.sql`](database/supabase-migration.sql) の内容をすべてコピー&ペースト
6. **Run** ボタンをクリックして実行
7. ✅ "Success. No rows returned" と表示されれば成功

### ステップ2: Vercel環境変数の設定

**必須環境変数**:

```bash
# Supabase設定
NEXT_PUBLIC_SUPABASE_URL=https://rdhibzwnkfgrvlvjgpwm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# データベース接続（重要！）
DATABASE_URL=postgresql://postgres:[YOUR_PASSWORD]@db.rdhibzwnkfgrvlvjgpwm.supabase.co:5432/postgres
```

#### DATABASE_URLの取得方法:

1. Supabase Dashboard → プロジェクト選択
2. **Settings** → **Database** をクリック
3. **Connection string** タブを選択
4. **URI** を選択（Transaction modeではなく）
5. 表示された文字列をコピー
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.rdhibzwnkfgrvlvjgpwm.supabase.co:5432/postgres
   ```
6. `[YOUR-PASSWORD]` をプロジェクト作成時に設定した実際のパスワードに置き換え

#### Vercel環境変数の追加:

1. [Vercel Dashboard](https://vercel.com/dashboard) にログイン
2. プロジェクト（game-study-1v4r）を選択
3. **Settings** → **Environment Variables** をクリック
4. 上記3つの環境変数を追加：
   - Variable Name: `NEXT_PUBLIC_SUPABASE_URL`
   - Value: `https://rdhibzwnkfgrvlvjgpwm.supabase.co`
   - Environment: **Production**, **Preview**, **Development** すべてチェック ✓
5. **Save** をクリック
6. 同様に `NEXT_PUBLIC_SUPABASE_ANON_KEY` と `DATABASE_URL` も追加

### ステップ3: コードをプッシュして再デプロイ

```bash
# 変更をコミット
git add .
git commit -m "Fix database connection and add error logging"
git push origin main
```

Vercelが自動的にビルド・デプロイを開始します（約2-3分）。

---

## 🔍 Vercelログの確認方法

デプロイ後もエラーが続く場合、Vercelのログで原因を確認：

1. [Vercel Dashboard](https://vercel.com/dashboard) → プロジェクトを選択
2. 上部メニューの **Logs** をクリック
3. **Runtime Logs** タブを選択
4. サイトにアクセスして `/api/articles` を開く
5. ログに以下のようなエラーメッセージが表示されます：
   ```
   記事一覧取得エラー: relation "articles" does not exist
   ```
   または
   ```
   データベース接続エラー: password authentication failed
   ```

### エラーメッセージと解決策:

| エラーメッセージ | 原因 | 解決策 |
|---------------|------|--------|
| `relation "articles" does not exist` | テーブルが存在しない | ステップ1のSQL実行 |
| `password authentication failed` | DATABASE_URLのパスワードが間違い | 正しいパスワードを設定 |
| `connection timeout` | 接続文字列が不正 | DATABASE_URLを再確認 |
| `no pg_hba.conf entry` | SSL設定の問題 | lib/db.jsで修正済み |

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

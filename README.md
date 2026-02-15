# GameStudy

Docker上でNext.js（App Router）とPostgreSQLを動かすマークダウン記事エディターです。

## 機能

- **マークダウン記事エディター**：記事をMarkdown形式で作成・編集
- **リアルタイムプレビュー**：編集しながらHTMLプレビューを確認
- **PostgreSQL データベース**：記事データを永続化
- **レスポンシブデザイン**：モバイル・デスクトップ対応

## 使い方

### 1. アプリケーションの起動

```bash
sudo docker compose up --build
```

### 2. アクセス

起動後に以下へアクセスしてください:

- **ホーム**: http://localhost:3000
- **記事一覧**: http://localhost:3000/articles

### 3. 記事の操作

1. **記事を読む**：一覧から記事タイトルをクリック
2. **記事を編集**：記事詳細画面の「編集」ボタンをクリック
3. **プレビュー**：編集画面の「プレビュー」ボタンで確認
4. **保存**：編集完了後「保存」ボタンで更新

## サンプル記事

初回起動時に「Roblox ゲーム開発入門」のサンプル記事が自動的に作成されます。

## 技術スタック

- **フロントエンド**: Next.js 14 (App Router), React
- **マークダウン処理**: react-markdown, remark-gfm
- **データベース**: PostgreSQL 16
- **コンテナ**: Docker, Docker Compose

## 環境変数

`.env.example` を参考に必要に応じて `.env` を作成してください。

## 停止

```bash
docker compose down
```

## 開発ノート

- マークダウン記法（GFM対応）でコードブロック、テーブル等が使用可能
- PostgreSQLは自動的にテーブルを作成
- DB接続確認機能でヘルスチェック可能

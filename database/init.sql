-- 記事テーブルの作成
CREATE TABLE IF NOT EXISTS articles (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- サンプル記事データの挿入
INSERT INTO articles (title, slug, content) VALUES 
(
    'Roblox ゲーム開発入門',
    'roblox-game-development-guide',
    '# Roblox ゲーム開発入門

## はじめに
Robloxは世界中で人気のゲームプラットフォームで、誰でも簡単にゲームを作成・公開できます。

## 必要なツール
- **Roblox Studio** - 公式の開発ツール
- **Lua言語** - Robloxのスクリプト言語

## 基本的なゲーム作成手順

### 1. Roblox Studio の起動
Roblox Studioを開いて新しいプロジェクトを作成します。

```lua
-- 基本的なスクリプトの例
local part = Instance.new("Part")
part.Parent = workspace
part.BrickColor = BrickColor.new("Bright red")
```

### 2. ワールドデザイン
- 地形ツールでマップを作成
- パーツを配置してオブジェクトを作る
- 照明やエフェクトを追加

### 3. スクリプトの追加
Luaスクリプトでゲームロジックを実装します：

```lua
-- プレイヤーが触れたときの処理
local function onTouch(hit)
    local humanoid = hit.Parent:FindFirstChild("Humanoid")
    if humanoid then
        print("プレイヤーがパーツに触れました！")
    end
end

script.Parent.Touched:Connect(onTouch)
```

## 人気ゲームジャンル
1. **アドベンチャー** - 探索とクエスト
2. **シミュレーター** - 職業体験や育成
3. **オービー** - アクションパズル
4. **ロールプレイ** - 社会体験

## 収益化
- **Robux** - ゲーム内通貨での収益
- **ゲームパス** - 特別な機能やアイテム
- **開発者製品** - 消耗品アイテム

## まとめ
Robloxでのゲーム開発は創造性を発揮できる素晴らしい機会です。基本を学んでオリジナルゲームを作ってみましょう！

---
*この記事は GameStudy で作成されました。*'
)
ON CONFLICT (slug) DO NOTHING;
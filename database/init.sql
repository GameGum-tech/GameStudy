-- ユーザーテーブルの作成
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    auth_uid UUID UNIQUE,  -- Supabase AuthのユーザーIDを保存
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    bio TEXT,
    avatar_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- タグテーブルの作成
CREATE TABLE IF NOT EXISTS tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    color VARCHAR(7) DEFAULT '#5271ff',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 記事テーブルの作成（拡張版）
CREATE TABLE IF NOT EXISTS articles (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    thumbnail_url VARCHAR(500),
    author_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    likes_count INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    published BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 記事タグ関連テーブル
CREATE TABLE IF NOT EXISTS article_tags (
    article_id INTEGER REFERENCES articles(id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (article_id, tag_id)
);

-- いいねテーブル
CREATE TABLE IF NOT EXISTS likes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    article_id INTEGER REFERENCES articles(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, article_id)
);

-- ブックマークテーブル
CREATE TABLE IF NOT EXISTS bookmarks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    article_id INTEGER REFERENCES articles(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, article_id)
);

-- サンプルユーザーの作成
INSERT INTO users (username, email, display_name, bio, avatar_url) VALUES 
('gamer_dev', 'gamer@gamestu.dy', 'GameDev Master', 'ゲーム開発の専門家です。Roblox、Unity、Unreal Engineを使った開発に詳しいです。', 'https://api.dicebear.com/7.x/avataaars/svg?seed=gamer_dev')
ON CONFLICT (username) DO NOTHING;

-- サンプルタグの作成
INSERT INTO tags (name, color) VALUES 
('Roblox', '#FF6B35'),
('Roblox Studio', '#00A2FF'),
('3DCG', '#8E44AD'),
('Lua', '#000080'),
('レベルデザイン', '#16A085'),
('ゲーム開発', '#5271ff'),
('初心者', '#28a745'),
('チュートリアル', '#17a2b8'),
('Unity', '#000000'),
('Unreal Engine', '#0E1128')
ON CONFLICT (name) DO NOTHING;

-- 記事テーブルの既存データを更新（author_idなどを追加）
UPDATE articles SET 
    author_id = (SELECT id FROM users WHERE username = 'gamer_dev' LIMIT 1),
    excerpt = 'Robloxでゲーム開発を始めるための完全ガイド。基本的なツールの使い方からLuaスクリプトまで、初心者にも分かりやすく解説します。',
    thumbnail_url = 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&h=400&fit=crop'
WHERE slug = 'roblox-game-development-guide';

-- サンプル記事にタグを追加
INSERT INTO article_tags (article_id, tag_id) 
SELECT a.id, t.id FROM articles a, tags t 
WHERE a.slug = 'roblox-game-development-guide' 
AND t.name IN ('Roblox', 'ゲーム開発', 'Lua', '初心者', 'チュートリアル')
ON CONFLICT DO NOTHING;

-- 追加のRoblox記事を作成
INSERT INTO articles (title, slug, content, excerpt, thumbnail_url, author_id) VALUES 
(
    'Roblox Studio完全マスター講座',
    'roblox-studio-complete-guide',
    '# Roblox Studio完全マスター講座

## Roblox Studioとは
Roblox Studioは、Robloxプラットフォーム上でゲームを作成するための公式開発ツールです。

## インストールと初期設定

### Roblox Studioのダウンロード
1. [Roblox公式サイト](https://www.roblox.com/)にアクセス
2. 「Create」セクションからStudioをダウンロード
3. インストーラーを実行して完了

### 初回起動設定
```lua
-- 基本設定のサンプルコード
game.Workspace.Gravity = 196.2 -- 重力設定
```

## 基本インターフェース

### ツールバーの使い方
- **Select Tool** - オブジェクトの選択
- **Move Tool** - オブジェクトの移動
- **Rotate Tool** - オブジェクトの回転
- **Scale Tool** - オブジェクトのサイズ変更

### エクスプローラーウィンドウ
ゲーム内のすべてのオブジェクトが階層表示されます：

```
game
├── Workspace (3Dワールド)
├── Players (プレイヤー管理)
├── ReplicatedStorage (共有データ)
└── ServerStorage (サーバー専用データ)
```

## パーツとモデルの操作

### 基本パーツの作成
1. Workspaceを右クリック
2. 「Insert Object」→「Part」を選択
3. プロパティパネルでカスタマイズ

### プロパティの編集
- **Material**: プラスチック、金属、木材など
- **BrickColor**: 色の変更
- **Size**: サイズの調整
- **Position**: 位置の設定

## 地形ツール（Terrain）

### 地形の作成
```lua
-- 地形生成のサンプル
local terrain = workspace.Terrain
terrain:FillRegion(
    Region3.new(Vector3.new(-50, 0, -50), Vector3.new(50, 10, 50)),
    4, -- 解像度
    Enum.Material.Grass
)
```

### 地形の編集
- **Generate** - 自動生成
- **Sculpt** - 手動編集
- **Paint** - マテリアル適用

## ライティングとエフェクト

### 照明設定
- **PointLight** - 点光源
- **SpotLight** - スポットライト
- **SurfaceLight** - サーフェスライト

```lua
-- ライト作成例
local light = Instance.new("PointLight")
light.Parent = part
light.Brightness = 2
light.Color = Color3.new(1, 0, 0) -- 赤色
```

## プレイテスト

### テストプレイの実行
1. ツールバーの「Play」ボタンをクリック
2. ゲーム内でプレイヤーとして操作
3. 「Stop」で編集モードに戻る

### デバッグツール
- **Output** - エラーメッセージ表示
- **Command Bar** - Luaコマンド実行
- **Developer Console** - 詳細なログ

## 保存と公開

### プロジェクトの保存
- **File** → **Save to Roblox** でクラウド保存
- **File** → **Save to File** でローカル保存

### ゲームの公開
1. **File** → **Publish to Roblox**
2. ゲーム名と説明を入力
3. プライバシー設定を選択
4. 公開ボタンをクリック

## まとめ
Roblox Studioは非常に強力な開発ツールです。基本操作をマスターして、創造性豊かなゲームを作成しましょう！

---
*次回はLuaスクリプティングについて詳しく解説します。*',
    'Roblox Studioの使い方を基礎から応用まで完全解説。インターフェース、ツール操作、地形編集、ライティングまで網羅したマスターガイドです。',
    'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800&h=400&fit=crop',
    (SELECT id FROM users WHERE username = 'gamer_dev' LIMIT 1)
),
(
    'Lua言語でRobloxスクリプト入門',
    'roblox-lua-scripting-basics',
    '# Lua言語でRobloxスクリプト入門

## Luaとは
Luaは軽量で高速なプログラミング言語で、Robloxのスクリプティングに使用されています。

## 変数とデータ型

### 基本的な変数宣言
```lua
-- 文字列
local playerName = "Player1"
local message = "Welcome to my game!"

-- 数値
local health = 100
local speed = 16
local jumpPower = 50

-- ブール値
local isAlive = true
local hasKey = false

-- nil（空の値）
local emptyValue = nil
```

### テーブル（配列・辞書）
```lua
-- 配列
local fruits = {"apple", "banana", "orange"}
print(fruits[1]) -- apple (Luaは1からスタート)

-- 辞書
local playerStats = {
    health = 100,
    mana = 50,
    level = 1
}
print(playerStats.health) -- 100
```

## 関数の作成

### 基本的な関数
```lua
-- シンプルな関数
local function greetPlayer(name)
    print("Hello, " .. name .. "!")
end

greetPlayer("Steve") -- Hello, Steve!

-- 値を返す関数
local function calculateDamage(baseDamage, multiplier)
    return baseDamage * multiplier
end

local damage = calculateDamage(10, 1.5)
print(damage) -- 15
```

### パラメータ付き関数
```lua
local function createPart(size, color, material)
    local part = Instance.new("Part")
    part.Size = size
    part.BrickColor = BrickColor.new(color)
    part.Material = Enum.Material[material]
    part.Parent = workspace
    return part
end

-- 使用例
createPart(Vector3.new(4, 1, 2), "Bright red", "Neon")
```

## 条件分岐

### if文
```lua
local function checkHealth(health)
    if health > 75 then
        print("体力は十分です")
    elseif health > 25 then
        print("体力が減っています")
    else
        print("危険！回復が必要です")
    end
end
```

### 複合条件
```lua
local function canEnterDungeon(level, hasKey)
    if level >= 10 and hasKey then
        print("ダンジョンに入れます")
        return true
    else
        print("条件を満たしていません")
        return false
    end
end
```

## ループ処理

### for ループ
```lua
-- 数値ループ
for i = 1, 5 do
    print("カウント: " .. i)
end

-- テーブルの要素を順番に処理
local colors = {"Red", "Green", "Blue"}
for index, color in ipairs(colors) do
    print(index .. ": " .. color)
end
```

### while ループ
```lua
local countdown = 10
while countdown > 0 do
    print("カウントダウン: " .. countdown)
    countdown = countdown - 1
    wait(1) -- 1秒待機
end
print("発射！")
```

## Roblox固有のオブジェクト操作

### パーツの作成と操作
```lua
-- パーツを作成
local part = Instance.new("Part")
part.Name = "MyPart"
part.Size = Vector3.new(4, 1, 2)
part.Position = Vector3.new(0, 10, 0)
part.BrickColor = BrickColor.new("Bright blue")
part.Parent = workspace

-- パーツを移動
part.Position = part.Position + Vector3.new(0, 5, 0)

-- パーツを回転
part.Rotation = Vector3.new(45, 0, 0)
```

### プレイヤーの操作
```lua
-- プレイヤーが参加したとき
game.Players.PlayerAdded:Connect(function(player)
    print(player.Name .. "がゲームに参加しました")
    
    player.CharacterAdded:Connect(function(character)
        local humanoid = character:WaitForChild("Humanoid")
        humanoid.WalkSpeed = 20 -- 移動速度を設定
        humanoid.JumpPower = 60 -- ジャンプ力を設定
    end)
end)
```

## イベントと接続

### タッチイベント
```lua
local part = workspace.TouchPart

part.Touched:Connect(function(hit)
    local character = hit.Parent
    local humanoid = character:FindFirstChild("Humanoid")
    
    if humanoid then
        print(character.Name .. "がパーツに触れました")
        -- 何らかの処理を実行
        humanoid.Health = humanoid.Health + 10
    end
end)
```

### カスタムイベント
```lua
-- RemoteEventの作成（ServerからClientへの通信）
local remoteEvent = Instance.new("RemoteEvent")
remoteEvent.Name = "UpdateScore"
remoteEvent.Parent = game.ReplicatedStorage

-- サーバースクリプト
local function updatePlayerScore(player, points)
    -- スコアを更新
    player.leaderstats.Score.Value = player.leaderstats.Score.Value + points
    
    -- クライアントに通知
    remoteEvent:FireClient(player, points)
end
```

## デバッグとテスト

### print文でのデバッグ
```lua
local function debugFunction(value)
    print("デバッグ: 値は " .. tostring(value) .. " です")
    print("型: " .. type(value))
end

debugFunction(42)
debugFunction("Hello")
debugFunction(true)
```

### エラーハンドリング
```lua
-- pcall を使用した安全な実行
local success, result = pcall(function()
    -- エラーが発生する可能性のある処理
    return workspace.NonExistentPart.Size
end)

if success then
    print("結果: " .. tostring(result))
else
    print("エラーが発生しました: " .. result)
end
```

## まとめ
Luaの基礎をマスターすることで、Robloxでより高度なゲームを作成できるようになります。実際にコードを書いて練習することが上達の鍵です！

---
*次回はマルチプレイヤーゲームの作り方について解説します。*',
    'RobloxでのLuaプログラミングを基礎から学べる入門ガイド。変数、関数、条件分岐、ループ、イベント処理まで実例付きで解説。',
    'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=800&h=400&fit=crop',
    (SELECT id FROM users WHERE username = 'gamer_dev' LIMIT 1)
),
(
    'Robloxマルチプレイヤーゲーム開発の極意',
    'roblox-multiplayer-game-development',
    '# Robloxマルチプレイヤーゲーム開発の極意

## マルチプレイヤーゲームの基本概念

### クライアント・サーバーアーキテクチャ
Robloxは自動的にサーバー・クライアント構成を提供します：

- **サーバー** - ゲームロジック、データ管理、プレイヤー間の同期
- **クライアント** - UI表示、入力処理、ローカル効果

### スクリプトの種類
```lua
-- ServerScript (サーバーサイド)
-- ゲームロジック、データベース操作
-- すべてのプレイヤーに影響

-- LocalScript (クライアントサイド)  
-- UI操作、カメラ制御
-- 個々のプレイヤー専用

-- ModuleScript (共通ライブラリ)
-- 再利用可能な関数群
-- サーバー・クライアント双方で使用可能
```

## データ管理とプレイヤー情報

### Leaderstatsの実装
```lua
-- ServerScript
game.Players.PlayerAdded:Connect(function(player)
    -- リーダーボードの作成
    local leaderstats = Instance.new("Folder")
    leaderstats.Name = "leaderstats"
    leaderstats.Parent = player
    
    -- スコア
    local score = Instance.new("IntValue")
    score.Name = "Score"
    score.Value = 0
    score.Parent = leaderstats
    
    -- レベル
    local level = Instance.new("IntValue")
    level.Name = "Level" 
    level.Value = 1
    level.Parent = leaderstats
    
    -- コイン
    local coins = Instance.new("IntValue")
    coins.Name = "Coins"
    coins.Value = 100  -- 初期コイン
    coins.Parent = leaderstats
end)
```

### DataStoreでのデータ永続化
```lua
-- ServerScript
local DataStoreService = game:GetService("DataStoreService")
local playerDataStore = DataStoreService:GetDataStore("PlayerData")

-- データ保存
local function savePlayerData(player)
    local success, errorMessage = pcall(function()
        local dataToSave = {
            score = player.leaderstats.Score.Value,
            level = player.leaderstats.Level.Value,
            coins = player.leaderstats.Coins.Value
        }
        
        playerDataStore:SetAsync(player.UserId, dataToSave)
    end)
    
    if not success then
        warn("データ保存に失敗: " .. errorMessage)
    end
end

-- データ読み込み
local function loadPlayerData(player)
    local success, data = pcall(function()
        return playerDataStore:GetAsync(player.UserId)
    end)
    
    if success and data then
        player.leaderstats.Score.Value = data.score or 0
        player.leaderstats.Level.Value = data.level or 1
        player.leaderstats.Coins.Value = data.coins or 100
    end
end

-- プレイヤーが参加/退出時の処理
game.Players.PlayerAdded:Connect(loadPlayerData)
game.Players.PlayerRemoving:Connect(savePlayerData)
```

## リモートイベントとネットワーク通信

### RemoteEventの基本
```lua
-- ReplicatedStorageにRemoteEventを作成
local remoteEvent = Instance.new("RemoteEvent")
remoteEvent.Name = "PurchaseItem" 
remoteEvent.Parent = game.ReplicatedStorage

-- ServerScript - サーバー側の処理
remoteEvent.OnServerEvent:Connect(function(player, itemName, itemPrice)
    -- プレイヤーのコインをチェック
    if player.leaderstats.Coins.Value >= itemPrice then
        player.leaderstats.Coins.Value = player.leaderstats.Coins.Value - itemPrice
        
        -- アイテムを付与
        giveItemToPlayer(player, itemName)
        
        -- 成功をクライアントに通知
        remoteEvent:FireClient(player, "success", itemName)
    else
        -- 失敗をクライアントに通知
        remoteEvent:FireClient(player, "error", "コインが不足しています")
    end
end)
```

```lua
-- LocalScript - クライアント側の処理
local remoteEvent = game.ReplicatedStorage:WaitForChild("PurchaseItem")

-- アイテム購入ボタンのクリック
local function onPurchaseClick(itemName, itemPrice)
    remoteEvent:FireServer(itemName, itemPrice)
end

-- サーバーからの応答を受信
remoteEvent.OnClientEvent:Connect(function(status, message)
    if status == "success" then
        print("購入成功: " .. message)
        updateInventoryUI()
    elseif status == "error" then
        print("エラー: " .. message)
        showErrorMessage(message)
    end
end)
```

## チーム機能の実装

### チームの作成と管理
```lua
-- ServerScript
local Teams = game:GetService("Teams")

-- チーム作成
local redTeam = Instance.new("Team")
redTeam.Name = "Red Team"
redTeam.TeamColor = BrickColor.new("Bright red")
redTeam.AutoAssignable = true
redTeam.Parent = Teams

local blueTeam = Instance.new("Team")
blueTeam.Name = "Blue Team" 
blueTeam.TeamColor = BrickColor.new("Bright blue")
blueTeam.AutoAssignable = true
blueTeam.Parent = Teams

-- プレイヤーのチーム振り分け
game.Players.PlayerAdded:Connect(function(player)
    wait(1) -- キャラクターの読み込み待機
    
    -- バランスの取れたチーム振り分け
    local redCount = #redTeam:GetPlayers()
    local blueCount = #blueTeam:GetPlayers()
    
    if redCount <= blueCount then
        player.Team = redTeam
    else
        player.Team = blueTeam
    end
    
    print(player.Name .. " が " .. player.Team.Name .. " に参加")
end)
```

### チームベースのゲームプレイ
```lua
-- チーム戦の得点システム
local teamScores = {
    ["Red Team"] = 0,
    ["Blue Team"] = 0
}

local function addTeamScore(teamName, points)
    teamScores[teamName] = teamScores[teamName] + points
    
    -- 全プレイヤーにスコア更新を通知
    for _, player in pairs(game.Players:GetPlayers()) do
        local updateScoreEvent = game.ReplicatedStorage.UpdateTeamScore
        updateScoreEvent:FireClient(player, teamScores)
    end
    
    -- 勝利条件チェック
    if teamScores[teamName] >= 100 then
        endGame(teamName)
    end
end
```

## リアルタイム同期とパフォーマンス

### 効率的な位置同期
```lua
-- MovingPartの同期（サーバー側）
local movingParts = {}

local function createMovingPart()
    local part = Instance.new("Part")
    part.Name = "MovingPart"
    part.Size = Vector3.new(4, 1, 2)
    part.Position = Vector3.new(0, 10, 0)
    part.BrickColor = BrickColor.new("Bright green")
    part.Parent = workspace
    
    -- 移動データを記録
    movingParts[part] = {
        startPos = part.Position,
        endPos = part.Position + Vector3.new(20, 0, 0),
        startTime = tick(),
        duration = 5
    }
end

-- 定期的な位置更新
game:GetService("RunService").Heartbeat:Connect(function()
    for part, data in pairs(movingParts) do
        local elapsed = tick() - data.startTime
        local alpha = math.min(elapsed / data.duration, 1)
        
        -- 線形補間で滑らかな移動
        part.Position = data.startPos:lerp(data.endPos, alpha)
        
        if alpha >= 1 then
            -- 移動完了、逆方向に設定
            data.startPos, data.endPos = data.endPos, data.startPos
            data.startTime = tick()
        end
    end
end)
```

### バッチ処理による最適化
```lua
-- 複数の処理をまとめて実行
local pendingUpdates = {}

local function queueUpdate(updateType, data)
    if not pendingUpdates[updateType] then
        pendingUpdates[updateType] = {}
    end
    table.insert(pendingUpdates[updateType], data)
end

-- 定期的にまとめて処理
local function processPendingUpdates()
    for updateType, updates in pairs(pendingUpdates) do
        if updateType == "scoreUpdate" then
            -- スコア更新をまとめて処理
            for _, update in ipairs(updates) do
                processScoreUpdate(update)
            end
        elseif updateType == "inventoryUpdate" then
            -- インベントリ更新をまとめて処理  
            for _, update in ipairs(updates) do
                processInventoryUpdate(update)
            end
        end
    end
    
    pendingUpdates = {} -- クリア
end

-- 0.1秒ごとに処理
spawn(function()
    while true do
        wait(0.1)
        processPendingUpdates()
    end
end)
```

## マッチメイキングとゲームモード

### ロビー系システム
```lua
-- GameModeManager
local GameModeManager = {}
local currentGameMode = "Lobby"
local gameModes = {
    Lobby = {
        minPlayers = 1,
        maxPlayers = 20,
        duration = math.huge
    },
    TeamDeathmatch = {
        minPlayers = 4,
        maxPlayers = 16, 
        duration = 300 -- 5分
    },
    CaptureTheFlag = {
        minPlayers = 6,
        maxPlayers = 12,
        duration = 600 -- 10分
    }
}

function GameModeManager.switchMode(newMode)
    if gameModes[newMode] then
        currentGameMode = newMode
        print("ゲームモードが " .. newMode .. " に変更されました")
        
        -- モード固有の初期化
        if newMode == "TeamDeathmatch" then
            initializeTeamDeathmatch()
        elseif newMode == "CaptureTheFlag" then
            initializeCaptureTheFlag()
        end
    end
end

function GameModeManager.canStartGame()
    local playerCount = #game.Players:GetPlayers()
    local mode = gameModes[currentGameMode]
    
    return playerCount >= mode.minPlayers and playerCount <= mode.maxPlayers
end
```

## まとめ
マルチプレイヤーゲーム開発では、ネットワーク通信、データ管理、パフォーマンス最適化が重要です。Robloxの強力な機能を活用して、魅力的な協力・対戦ゲームを作成しましょう！

---
*これらのテクニックを組み合わせることで、本格的なマルチプレイヤーゲームを開発できます。*',
    'Robloxでマルチプレイヤーゲームを開発するための上級テクニック。サーバー・クライアント通信、データ管理、チーム機能、リアルタイム同期まで詳しく解説。',
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&h=400&fit=crop',
    (SELECT id FROM users WHERE username = 'gamer_dev' LIMIT 1)
)
ON CONFLICT (slug) DO NOTHING;

-- 新記事にタグを追加
INSERT INTO article_tags (article_id, tag_id) 
SELECT a.id, t.id FROM articles a, tags t 
WHERE a.slug = 'roblox-studio-complete-guide'
AND t.name IN ('Roblox', 'ゲーム開発', 'チュートリアル', '初心者')
ON CONFLICT DO NOTHING;

INSERT INTO article_tags (article_id, tag_id)
SELECT a.id, t.id FROM articles a, tags t 
WHERE a.slug = 'roblox-lua-scripting-basics'
AND t.name IN ('Roblox', 'Lua', 'ゲーム開発', 'チュートリアル')
ON CONFLICT DO NOTHING;

INSERT INTO article_tags (article_id, tag_id)
SELECT a.id, t.id FROM articles a, tags t 
WHERE a.slug = 'roblox-multiplayer-game-development'
AND t.name IN ('Roblox', 'ゲーム開発', 'Lua')
ON CONFLICT DO NOTHING;
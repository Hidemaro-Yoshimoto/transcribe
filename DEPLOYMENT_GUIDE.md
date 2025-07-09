# 🚀 Vercel + Supabase デプロイガイド

## 📋 準備するもの
- GitHubアカウント
- OpenAI APIキー（課金設定済み）
- 20分程度の時間

## Step 1: Supabase プロジェクト作成 (5分)

### 1-1. アカウント作成
1. https://supabase.com にアクセス
2. 「Start your project」をクリック
3. GitHubアカウントでサインアップ（推奨）

### 1-2. プロジェクト作成
1. 「New project」をクリック
2. Organization: Personal でOK
3. Name: `transcribe-app` （任意の名前）
4. Database Password: **強いパスワードを設定（必ずメモ！）**
5. Region: **Northeast Asia (Tokyo)** を選択
6. Pricing Plan: **Free** を選択
7. 「Create new project」をクリック

⏰ **待機時間**: 約2-3分でプロジェクトが作成されます

### 1-3. データベーススキーマ作成
1. 左サイドバーの「**SQL Editor**」をクリック
2. 「**New query**」をクリック
3. 以下のSQLコードをコピー&ペースト:

```sql
-- Supabase database schema for transcription app

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Transcription records table
CREATE TABLE transcription_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    transcription_text TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    file_size BIGINT NOT NULL,
    duration FLOAT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Task progress table for real-time updates
CREATE TABLE task_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID REFERENCES transcription_records(id) ON DELETE CASCADE,
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    message TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(task_id)
);

-- Indexes for better performance
CREATE INDEX idx_transcription_records_status ON transcription_records(status);
CREATE INDEX idx_transcription_records_created_at ON transcription_records(created_at DESC);
CREATE INDEX idx_task_progress_task_id ON task_progress(task_id);
CREATE INDEX idx_task_progress_updated_at ON task_progress(updated_at DESC);

-- RLS (Row Level Security) policies
ALTER TABLE transcription_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_progress ENABLE ROW LEVEL SECURITY;

-- Allow public read access (you may want to add authentication later)
CREATE POLICY "Public can view transcription records" ON transcription_records
    FOR SELECT USING (true);

CREATE POLICY "Public can insert transcription records" ON transcription_records
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can update transcription records" ON transcription_records
    FOR UPDATE USING (true);

CREATE POLICY "Public can view task progress" ON task_progress
    FOR SELECT USING (true);

CREATE POLICY "Public can insert task progress" ON task_progress
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can update task progress" ON task_progress
    FOR UPDATE USING (true);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_transcription_records_updated_at
    BEFORE UPDATE ON transcription_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_progress_updated_at
    BEFORE UPDATE ON task_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Storage bucket for audio files
INSERT INTO storage.buckets (id, name, public) VALUES ('audio-files', 'audio-files', false);

-- Storage policies
CREATE POLICY "Public can upload audio files" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'audio-files');

CREATE POLICY "Public can view audio files" ON storage.objects
    FOR SELECT USING (bucket_id = 'audio-files');

CREATE POLICY "Public can delete audio files" ON storage.objects
    FOR DELETE USING (bucket_id = 'audio-files');
```

4. 「**RUN**」ボタンをクリック
5. 成功メッセージが表示されればOK ✅

### 1-4. API キー取得
1. 左サイドバーの「**Settings**」→「**API**」をクリック
2. 以下の値を**必ずメモ**してください：

```
📝 メモ用テンプレート:
Project URL: https://xxxxxxxxxxxx.supabase.co
anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ...
```

---

## Step 2: OpenAI API キー取得 (3分)

1. https://platform.openai.com/api-keys にアクセス
2. OpenAIアカウントでログイン（なければ作成）
3. 「**Create new secret key**」をクリック
4. Name: `transcribe-app`
5. キーをコピーしてメモ

```
📝 メモ用テンプレート:
OpenAI API Key: sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

⚠️ **注意**: このキーは一度しか表示されません！必ずメモしてください。

---

## Step 3: GitHub リポジトリ準備 (5分)

### 3-1. 新しいリポジトリ作成
1. https://github.com/new にアクセス
2. Repository name: `transcribe-app`
3. **「Public」**を選択（Vercel無料プランの場合）
4. 「**Create repository**」をクリック

### 3-2. コードをアップロード
ローカルターミナルで以下を実行:

```bash
cd transcribe_app_api
git init
git add .
git commit -m "Initial commit: Vercel + Supabase version"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/transcribe-app.git
git push -u origin main
```

⚠️ **YOUR_USERNAME** を実際のGitHubユーザー名に変更してください。

---

## Step 4: Vercel デプロイ (5分)

### 4-1. Vercel アカウント作成
1. https://vercel.com にアクセス
2. 「**Start Deploying**」をクリック
3. GitHubアカウントで連携

### 4-2. プロジェクトインポート
1. 「**Add New Project**」をクリック
2. GitHubから「**transcribe-app**」リポジトリを選択
3. 「**Import**」をクリック
4. 設定:
   - Framework Preset: **「Other」**
   - Root Directory: **そのまま**
   - Build Command: `npm run build`
   - Output Directory: `frontend/dist`

### 4-3. 環境変数設定
「**Environment Variables**」セクションで以下を追加:

| Name | Value |
|------|-------|
| `SUPABASE_URL` | (Step 1-4でメモしたProject URL) |
| `SUPABASE_ANON_KEY` | (Step 1-4でメモしたanon public key) |
| `SUPABASE_SERVICE_ROLE_KEY` | (Step 1-4でメモしたservice_role key) |
| `OPENAI_API_KEY` | (Step 2でメモしたOpenAI API key) |

### 4-4. デプロイ実行
1. 「**Deploy**」ボタンをクリック
2. ビルドが開始されます（約2-3分）
3. 成功すると「**Congratulations!**」画面が表示
4. URLをクリックしてアプリにアクセス 🎉

---

## 📝 作業チェックリスト

- [ ] Step 1: Supabase プロジェクト作成完了
- [ ] Step 2: OpenAI API キー取得完了  
- [ ] Step 3: GitHub リポジトリ作成完了
- [ ] Step 4: Vercel デプロイ完了

## 🆘 困った時の対処法

### よくあるエラーと解決法

#### Supabase SQL実行エラー
```
エラー: permission denied for schema public
解決: プロジェクトが完全に作成されるまで待つ（2-3分）
```

#### Vercel ビルドエラー
```
エラー: Module not found
解決: 環境変数が正しく設定されているか確認
```

#### OpenAI API エラー
```
エラー: Incorrect API key
解決: APIキーが正しくコピーされているか確認
```

## 🎯 完了後の確認事項

デプロイが成功したら、以下を確認:

1. ✅ フロントエンドが表示される
2. ✅ ファイルアップロードができる
3. ✅ 文字起こしが実行される
4. ✅ 履歴が表示される

---

## 💰 コスト情報

### 完全無料で運用可能
- **Vercel**: 個人利用は永続無料
- **Supabase**: 500MBまで永続無料  
- **コスト**: OpenAI利用料のみ（$0.006/分）

### 月間利用例
- 毎日10分の音声: 約$1.8/月
- 週1回30分の音声: 約$0.7/月

---

**準備ができたら Step 1 から開始してください！**
各ステップ完了時に「Step X完了」とお知らせください。
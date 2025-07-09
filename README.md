# Transcribe App API

音声・動画ファイルをOpenAI Whisper APIで文字起こしするWebアプリケーション

## 機能

- 音声・動画ファイルのドラッグ&ドロップアップロード
- OpenAI Whisper APIによる高精度な文字起こし
- リアルタイム処理進捗表示
- 文字起こし履歴の一覧表示
- テキストのクリップボードコピー
- TXTファイルのダウンロード
- Docker Composeによる簡単デプロイ

## 対応ファイル形式

- 音声: MP3, WAV, M4A
- 動画: MP4, AVI, MOV, MKV
- ファイルサイズ制限: 400MB

## セットアップ

### 1. プロジェクトの準備

プロジェクトディレクトリに移動:

```bash
cd transcribe_app_api
```

### 2. 環境変数設定

```bash
cp .env.example .env
```

`.env`ファイルを編集してOpenAI API Keyを設定:

```
OPENAI_API_KEY=your_openai_api_key_here
```

### 3. Docker Composeで起動

```bash
docker-compose up --build
```

### 4. アクセス

- フロントエンド: http://localhost:3000
- バックエンドAPI: http://localhost:8000
- API ドキュメント: http://localhost:8000/docs

## 開発環境での起動

### バックエンド

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### Celeryワーカー

```bash
cd backend
celery -A tasks.celery_app worker --loglevel=info
```

### フロントエンド

```bash
cd frontend
npm install
npm run dev
```

## API エンドポイント

### POST /upload
音声ファイルをアップロードして文字起こしを開始

### GET /status/{task_id}
文字起こしタスクの進捗状況を取得

### GET /history
文字起こし履歴を取得

### GET /download/{record_id}
文字起こし結果のTXTファイルをダウンロード

### GET /health
ヘルスチェック

## 料金について

### OpenAI Whisper API料金
- **$0.006 / 分** (2024年時点)

### 料金計算例
- 10分の音声ファイル: $0.06
- 1時間の音声ファイル: $0.36
- 1日8時間の会議録音: $2.88

### 月間利用例
- 毎日1時間の音声 (30日): $10.80
- 週2回の2時間会議 (8回): $5.76
- 月100分の音声: $0.60

## 技術スタック

### バックエンド
- FastAPI
- Celery (Redis)
- OpenAI Python SDK
- SQLModel + SQLite
- FFmpeg

### フロントエンド
- React 18
- Vite
- Tailwind CSS
- React Dropzone

### インフラ
- Docker & Docker Compose
- Redis

## セキュリティ

- API Keyは環境変数で管理
- アップロードファイルのサイズ制限
- 対応ファイル形式の制限
- 一時ファイルの自動削除

## 制約事項

- 30分を超える音声は自動分割して処理
- 同時処理数はCeleryワーカーの設定に依存
- SQLiteを使用（本番環境ではPostgreSQLを推奨）

## トラブルシューティング

### よくある問題

1. **OpenAI API エラー**
   - API Keyが正しく設定されているか確認
   - OpenAI アカウントの残高を確認

2. **ファイルアップロードエラー**
   - ファイルサイズが400MB以下か確認
   - 対応ファイル形式か確認

3. **Dockerビルドエラー**
   - Docker Composeが最新版か確認
   - ディスク容量を確認

### ログ確認

```bash
# 全サービスのログ
docker-compose logs

# 特定サービスのログ
docker-compose logs backend
docker-compose logs celery
docker-compose logs frontend
```

## 本番環境への展開

1. **データベース**: SQLiteをPostgreSQLに変更
2. **ファイルストレージ**: S3などのクラウドストレージを使用
3. **スケーリング**: Celeryワーカーを複数起動
4. **監視**: ログ監視とメトリクス収集
5. **セキュリティ**: HTTPS、認証機能の追加

## ライセンス

MIT License
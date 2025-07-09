# Google Cloud 無料デプロイガイド

## 🎯 無料運用戦略

### 戦略1: 90日間完全無料（$300クレジット活用）
- **期間**: 3ヶ月間
- **コスト**: $0
- **制限**: クレジット消費後は課金開始

### 戦略2: 長期最小コスト運用
- **期間**: 無制限
- **コスト**: 月額 $5-10
- **制限**: f1-microインスタンスのみ

## 🚀 セットアップ手順

### Phase 1: GCPプロジェクト作成 (5分)
```bash
# 1. Google Cloud Console でプロジェクト作成
# 2. 必要なAPIを有効化
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable cloudtasks.googleapis.com
gcloud services enable secretmanager.googleapis.com
```

### Phase 2: データベース設定 (10分)
```bash
# Cloud SQL PostgreSQL インスタンス作成
gcloud sql instances create transcribe-db \
    --database-version=POSTGRES_15 \
    --tier=db-f1-micro \
    --region=us-central1

# データベース作成
gcloud sql databases create transcribe_db --instance=transcribe-db

# ユーザー作成
gcloud sql users create transcribe_user \
    --instance=transcribe-db \
    --password=your_secure_password
```

### Phase 3: シークレット管理 (5分)
```bash
# OpenAI API Key を Secret Manager に保存
echo "your_openai_api_key" | gcloud secrets create openai-api-key --data-file=-

# データベースURL を保存
echo "postgresql://transcribe_user:password@/transcribe_db?host=/cloudsql/PROJECT_ID:us-central1:transcribe-db" | \
gcloud secrets create database-url --data-file=-
```

### Phase 4: アプリケーションデプロイ (10分)
```bash
# Cloud Build でビルド & デプロイ
gcloud builds submit --config=gcp-deployment/cloudbuild.yaml

# Cloud Run サービス確認
gcloud run services list
```

### Phase 5: フロントエンドデプロイ (5分)
```bash
# Firebase Hosting (無料)
cd frontend
npm run build
firebase init hosting
firebase deploy
```

## 💰 コスト最適化

### 無料枠活用
- **Compute Engine**: f1-micro (永続無料)
- **Cloud Storage**: 5GB (永続無料)
- **Cloud Functions**: 200万回/月 (永続無料)
- **Cloud Build**: 120分/日 (永続無料)

### 推定月額コスト
- **Cloud SQL**: $7-15/月
- **Memorystore**: $25/月 (最小構成)
- **Cloud Run**: $0 (リクエストベース)
- **合計**: $10-20/月

## ⚠️ 注意点とコード変更

### 必要な変更
1. **Celery → Cloud Functions** (中程度)
2. **Redis → Memorystore** (最小)
3. **File Storage → Cloud Storage** (最小)
4. **Environment Variables → Secret Manager** (最小)

### 開発工数
- **初回設定**: 2-3時間
- **コード修正**: 3-4時間
- **テスト**: 2-3時間
- **合計**: 1日程度

## 🎉 メリット・デメリット

### ✅ メリット
- 90日間完全無料
- Google のインフラ活用
- 自動スケーリング
- 高い可用性

### ⚠️ デメリット
- 設定が複雑
- コード変更が必要
- 長期的にはRailwayより高額
- 学習コストが高い

## 🏆 推奨判断

**Google Cloud がおすすめな場合:**
- GCP学習したい
- 90日間の無料期間を活用したい
- 将来的に大規模化予定

**Railway がおすすめな場合:**
- 今すぐ簡単にデプロイしたい
- 長期的な運用コストを抑えたい
- コード変更を最小限にしたい
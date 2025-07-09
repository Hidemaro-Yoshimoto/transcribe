# 推奨デプロイ構成: Vercel + Railway

## 構成概要
- **Frontend**: Vercel (React) - 超高速
- **Backend**: Railway (FastAPI + Celery) - フル機能
- **Database**: Railway PostgreSQL - 高性能
- **Redis**: Railway Redis - 低遅延

## メリット
✅ **フロントエンド**: Vercelの高速CDN
✅ **バックエンド**: 全機能そのまま利用可能
✅ **簡単設定**: 最小限の変更
✅ **コスパ**: 月額$10程度で運用可能

## デプロイ手順

### 1. フロントエンド (Vercel)
```bash
# 1. Vercelアカウント作成
# 2. GitHubリポジトリ連携
# 3. 自動デプロイ設定

# 環境変数設定
VITE_API_BASE_URL=https://your-railway-api.up.railway.app
```

### 2. バックエンド (Railway)
```bash
# 1. Railway アカウント作成
# 2. PostgreSQL + Redis サービス追加
# 3. Web サービス作成
# 4. 環境変数設定

OPENAI_API_KEY=your_key
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
ENVIRONMENT=production
```

### 3. API URL更新
```javascript
// frontend/src/App.jsx
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://your-railway-api.up.railway.app';
```

## コスト試算
- **Vercel**: $0 (Hobby Plan)
- **Railway**: $10/月 (PostgreSQL + Redis + API)
- **OpenAI**: 使用量ベース ($0.006/分)

**総計**: 月額 $10 + OpenAI使用料
FROM node:18-alpine

# 作業ディレクトリの設定
WORKDIR /app

# package.json と package-lock.json をコピー
COPY package*.json ./

# 依存関係をインストール
RUN npm install

# アプリケーションコードをコピー
COPY . .

# ポート公開
EXPOSE 3000

# 開発サーバーを起動
CMD ["npm", "run", "dev"]
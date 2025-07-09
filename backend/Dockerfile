FROM python:3.11-slim

# FFmpeg のインストール
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# 作業ディレクトリの設定
WORKDIR /app

# 依存関係をインストール
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# アプリケーションコードをコピー
COPY . .

# ポート公開
EXPOSE 8000

# デフォルトコマンド
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
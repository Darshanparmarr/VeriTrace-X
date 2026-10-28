# VeriTrace-X backend image.
# Python 3.12-slim: all ML deps (scikit-learn/xgboost/shap) have cp312 linux wheels.
FROM python:3.12-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# System deps (libgomp1 is needed by xgboost/scikit-learn at runtime).
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python deps first (better layer caching).
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --upgrade pip && pip install -r backend/requirements.txt

# Copy the backend app and the shared ML package (REPO_ROOT == /app).
COPY backend/ ./backend/
COPY ml/ ./ml/

# Bake a SYNTHETIC-data model so the image serves predictions out of the box.
# (Clearly labelled synthetic; retrain on the real DataCo CSV for real metrics.)
RUN cd ml && python -m veritrace_ml.train || echo "training skipped"

WORKDIR /app/backend
EXPOSE 8000

# Entrypoint runs migrations then starts the server.
RUN chmod +x entrypoint.sh
ENTRYPOINT ["./entrypoint.sh"]

FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY backend/pyproject.toml .
RUN pip install --no-cache-dir hatchling
RUN pip install --no-cache-dir fastapi "uvicorn[standard]" pydantic pydantic-settings sqlalchemy psycopg2-binary pandas openpyxl rapidfuzz python-multipart httpx pytest pytest-asyncio

COPY backend/ .

EXPOSE 8000

CMD ["python", "run.py"]

FROM python:3.11-slim AS builder

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt


FROM python:3.11-slim AS runtime

WORKDIR /app

COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

COPY . .

ENV PORT=8080
EXPOSE 8080

RUN adduser --disabled-password --gecos "" appuser
USER appuser

CMD ["uvicorn", "main:app", \
     "--host", "0.0.0.0", \
     "--port", "8080", \
     "--workers", "1", \
     "--log-level", "info"]
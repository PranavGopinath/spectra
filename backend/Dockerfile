FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Install CPU-only PyTorch FIRST (before sentence-transformers)
# This prevents sentence-transformers from pulling in CUDA version
RUN pip install --no-cache-dir torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu

# sentence-transformers will see torch is already installed and use the CPU version
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE ${PORT:-8000}

# Run the application
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
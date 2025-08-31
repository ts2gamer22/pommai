# FastRTC Gateway Server Dockerfile

FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libsndfile1 \
    libportaudio2 \
    libopus0 \
    libvpx-dev \
    gcc \
    g++ \
    make \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Download Whisper model during build
RUN python -c "import whisper; whisper.load_model('base')"

# Copy application code
COPY . .

# Create directory for temporary audio files
RUN mkdir -p /tmp/audio

# Environment variables (will be overridden at runtime)
ENV CONVEX_URL=""
ENV CONVEX_DEPLOY_KEY=""
ENV OPENROUTER_API_KEY=""
ENV PYTHONUNBUFFERED=1

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Run the server
CMD ["python", "server.py"]

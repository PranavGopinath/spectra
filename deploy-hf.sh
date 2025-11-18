#!/bin/bash
# Deploy Spectra backend to Hugging Face Spaces

set -e

echo "🚀 Deploying to Hugging Face Spaces..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if HF Space repo exists
# Path to HF Space repo
HF_SPACE_DIR="${HF_SPACE_DIR:-/home/pranav/spectra-hf}"
if [ ! -d "$HF_SPACE_DIR" ]; then
    echo -e "${BLUE}📦 HF Space repo not found at $HF_SPACE_DIR${NC}"
    echo "Please update HF_SPACE_DIR in the script or set it as an environment variable"
    echo "Example: HF_SPACE_DIR=/path/to/spectra-hf ./deploy-hf.sh"
    exit 1
fi

cd "$HF_SPACE_DIR"

# Pull latest changes
echo -e "${BLUE}📥 Pulling latest changes...${NC}"
git pull

# Copy backend files
echo -e "${BLUE}📋 Syncing backend files...${NC}"
# Get absolute path to spectra directory (where this script is located)
SPECTRA_DIR="$(cd "$(dirname "$0")" && pwd)"

if ! command -v rsync >/dev/null 2>&1; then
    echo "rsync is required but not installed. Please install rsync and rerun."
    exit 1
fi

mkdir -p "$HF_SPACE_DIR/backend"
rsync -av --delete \
    --exclude "__pycache__" \
    --exclude ".pytest_cache" \
    --exclude ".env" \
    "$SPECTRA_DIR/backend/" "$HF_SPACE_DIR/backend/"

# Keep Dockerfile and requirements aligned for Hugging Face build
cp "$SPECTRA_DIR/backend/Dockerfile" "$HF_SPACE_DIR/Dockerfile"
cp "$SPECTRA_DIR/backend/requirements.txt" "$HF_SPACE_DIR/requirements.txt"

# Remove .env if it exists (secrets are in HF Space settings)
rm -f .env

# Add all files
git add .

# Check if there are changes
if git diff --staged --quiet; then
    echo -e "${GREEN}✓ No changes to deploy${NC}"
else
    echo -e "${BLUE}💾 Committing changes...${NC}"
    git commit -m "Deploy: $(date '+%Y-%m-%d %H:%M:%S')"
    
    echo -e "${BLUE}🚀 Pushing to Hugging Face Spaces...${NC}"
    git push
    
    echo -e "${GREEN}✅ Deployment complete!${NC}"
    echo -e "${BLUE}Check your Space: https://huggingface.co/spaces/pranavgo/spectra${NC}"
fi

cd ..


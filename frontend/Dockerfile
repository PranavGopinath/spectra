FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy application code
COPY . .

# Expose port
EXPOSE 3000

# Set environment variable for API URL (can be overridden)
ENV NEXT_PUBLIC_API_URL=http://localhost:8000

# Run dev server in development mode
# For production, use: CMD ["npm", "run", "start"]
CMD ["npm", "run", "dev"]

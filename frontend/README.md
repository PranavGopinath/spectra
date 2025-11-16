# Spectra Frontend

Chat-based UI for discovering movies, music, and books based on your taste preferences.

## Features

- 💬 **Chat Interface**: Natural conversation-style interaction
- 📊 **Taste Visualization**: Interactive radar chart showing your 8D taste profile
- 🎬🎵📚 **Cross-Domain Recommendations**: Discover content across movies, music, and books
- 🎨 **Modern UI**: Clean, responsive design with dark mode support

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Backend server running on `http://localhost:8000` (or configure `NEXT_PUBLIC_API_URL`)

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Configuration

Create a `.env.local` file (optional):

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

If not set, defaults to `http://localhost:8000`.

### Build

```bash
npm run build
npm start
```

## Usage

1. **Start a conversation**: Type your taste preferences in natural language
   - Example: "I love dark, complex psychological thrillers with deep characters"
   - Example: "I enjoy upbeat, energetic music with complex arrangements"

2. **View your taste profile**: See your 8D taste vector visualized as a radar chart

3. **Explore recommendations**: Browse personalized recommendations across movies, music, and books

4. **Continue the conversation**: Ask for more recommendations or refine your preferences

## Components

- `ChatInterface`: Main chat container with message history
- `ChatMessage`: Individual message component (user/assistant)
- `TasteRadar`: Radar chart visualization of taste vector
- `RecommendationCard`: Card component for displaying recommendations

## API Integration

The frontend communicates with the backend API through `lib/api.ts`:

- `analyzeTaste()`: Analyze user text and get taste vector
- `getRecommendations()`: Get personalized recommendations
- `getDimensions()`: Fetch taste dimension definitions
- `getStats()`: Get database statistics


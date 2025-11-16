/**
 * API client for Spectra backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface TasteAnalysisResponse {
  taste_vector: number[];
  breakdown: Array<{
    dimension: string;
    score: number;
    tendency: string;
    description: string;
  }>;
}

export interface RecommendationItem {
  id: string;
  title: string;
  media_type: string;
  year?: number;
  description: string;
  metadata: Record<string, any>;
  similarity: number;
}

export interface RecommendationsResponse {
  movie?: RecommendationItem[];
  music?: RecommendationItem[];
  book?: RecommendationItem[];
}

export interface DimensionInfo {
  name: string;
  description: string;
  positive_prompt: string;
  negative_prompt: string;
  examples: Record<string, Record<string, string>>;
}

export interface StatsResponse {
  total: number;
  movies: number;
  music: number;
  books: number;
}

/**
 * Analyze user's taste from text input
 */
export async function analyzeTaste(text: string): Promise<TasteAnalysisResponse> {
  const response = await fetch(`${API_BASE_URL}/api/taste/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    throw new Error(`Failed to analyze taste: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get recommendations based on query
 */
export async function getRecommendations(
  query: string,
  options?: {
    media_types?: string[];
    top_k?: number;
    min_year?: number;
    max_year?: number;
  }
): Promise<RecommendationsResponse> {
  const response = await fetch(`${API_BASE_URL}/api/recommend`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      ...options,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to get recommendations: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get all taste dimensions
 */
export async function getDimensions(): Promise<DimensionInfo[]> {
  const response = await fetch(`${API_BASE_URL}/api/dimensions`);

  if (!response.ok) {
    throw new Error(`Failed to get dimensions: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get database statistics
 */
export async function getStats(): Promise<StatsResponse> {
  const response = await fetch(`${API_BASE_URL}/api/stats`);

  if (!response.ok) {
    throw new Error(`Failed to get stats: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Find similar items to a given item
 */
export async function findSimilar(
  itemId: string,
  options?: {
    media_types?: string[];
    top_k?: number;
  }
): Promise<RecommendationsResponse> {
  const response = await fetch(`${API_BASE_URL}/api/similar/${itemId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(options || {}),
  });

  if (!response.ok) {
    throw new Error(`Failed to find similar items: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get item details by ID
 */
export async function getItem(itemId: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/api/item/${itemId}`);

  if (!response.ok) {
    throw new Error(`Failed to get item: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Generate contextual chat response using LLM
 */
export async function generateResponse(
  userInput: string,
  tasteAnalysis: TasteAnalysisResponse,
  conversationHistory?: Array<{ role: string; content: string }>
): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/api/generate-response`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user_input: userInput,
      taste_analysis: tasteAnalysis,
      conversation_history: conversationHistory,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to generate response: ${response.statusText}`);
  }

  const data = await response.json();
  return data.response;
}


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
  const response = await fetch(`${API_BASE_URL}/api/taste/dimensions`);

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
 * Generate contextual intro for recommendations using template-based approach
 */
export async function generateResponse(
  userInput: string,
  tasteAnalysis: TasteAnalysisResponse,
  conversationHistory?: Array<{ role: string; content: string }>
): Promise<string> {
  // Template-based generation (fast, instant response)
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

// User Management APIs
export interface CreateUserRequest {
  email: string;
  username?: string;
}

export interface UserResponse {
  id: string;
  email: string;
  username?: string;
  created_at?: string;
}

export interface RatingRequest {
  item_id: string;
  rating: number; // 1-5
  notes?: string;
  favorite?: boolean;
  want_to_consume?: boolean;
}

export interface RatingResponse {
  id: string;
  user_id: string;
  item_id: string;
  rating: number;
  notes?: string;
  favorite?: boolean;
  want_to_consume?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface UserRatingWithItem extends RatingResponse {
  item: {
    id: string;
    title: string;
    media_type: string;
    year?: number;
    description: string;
    metadata: Record<string, any>;
  };
}

export interface UserRatingsResponse {
  ratings: UserRatingWithItem[];
}

export interface UserTasteProfileResponse {
  taste_vector: number[];
  breakdown: Array<{
    dimension: string;
    score: number;
    tendency: string;
    description: string;
  }>;
  num_ratings: number;
}

/**
 * Register a new user with email and password
 */
export async function register(email: string, password: string, username?: string): Promise<{ access_token: string; user: UserResponse }> {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password, username }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || `Failed to register: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Login with email and password
 */
export async function login(email: string, password: string): Promise<{ access_token: string; user: UserResponse }> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || `Failed to login: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Initiate OAuth flow (redirects to provider)
 */
export function initiateOAuth(provider: 'google' | 'github'): void {
  window.location.href = `${API_BASE_URL}/api/auth/oauth/${provider}/authorize`;
}

/**
 * Get user by ID
 */
export async function getUser(userId: string): Promise<UserResponse> {
  const response = await fetch(`${API_BASE_URL}/api/users/${userId}`);

  if (!response.ok) {
    throw new Error(`Failed to get user: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Add or update a rating
 */
export async function addRating(
  userId: string,
  rating: RatingRequest
): Promise<RatingResponse> {
  const response = await fetch(`${API_BASE_URL}/api/users/${userId}/ratings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(rating),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || `Failed to add rating: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get all ratings for a user
 */
export async function getUserRatings(userId: string): Promise<UserRatingsResponse> {
  const response = await fetch(`${API_BASE_URL}/api/users/${userId}/ratings`);

  if (!response.ok) {
    throw new Error(`Failed to get user ratings: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Delete a rating
 */
export async function deleteRating(userId: string, itemId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/users/${userId}/ratings/${itemId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(`Failed to delete rating: ${response.statusText}`);
  }
}

/**
 * Get user's taste profile computed from ratings
 */
export async function getUserTasteProfile(userId: string): Promise<UserTasteProfileResponse> {
  const response = await fetch(`${API_BASE_URL}/api/users/${userId}/taste-profile`);

  if (!response.ok) {
    throw new Error(`Failed to get user taste profile: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get personalized recommendations for a user based on their ratings
 */
export async function getUserRecommendations(
  userId: string,
  options?: {
    media_types?: string[];
    top_k?: number;
    exclude_rated?: boolean;
  }
): Promise<RecommendationsResponse> {
  const params = new URLSearchParams();
  if (options?.media_types) {
    params.append('media_types', options.media_types.join(','));
  }
  if (options?.top_k) {
    params.append('top_k', options.top_k.toString());
  }
  if (options?.exclude_rated !== undefined) {
    params.append('exclude_rated', options.exclude_rated.toString());
  }

  const url = `${API_BASE_URL}/api/users/${userId}/recommendations${params.toString() ? '?' + params.toString() : ''}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to get user recommendations: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Onboarding interfaces
 */
export interface OnboardingMediaItem {
  id: string;
  title: string;
  media_type: string;
  year?: number;
  description?: string;
  metadata?: Record<string, any>;
}

export interface OnboardingItemsResponse {
  movies: OnboardingMediaItem[];
  books: OnboardingMediaItem[];
  music: OnboardingMediaItem[];
}

export interface SubmitPreferencesResponse {
  success: boolean;
  message: string;
  items_added: number;
}

/**
 * Get items for onboarding selection
 */
export async function getOnboardingItems(): Promise<OnboardingItemsResponse> {
  const response = await fetch(`${API_BASE_URL}/api/onboarding/items`);

  if (!response.ok) {
    throw new Error(`Failed to get onboarding items: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Submit initial preferences during onboarding
 */
export async function submitInitialPreferences(
  userId: string,
  itemIds: string[]
): Promise<SubmitPreferencesResponse> {
  const response = await fetch(`${API_BASE_URL}/api/onboarding/${userId}/preferences`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ item_ids: itemIds }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || `Failed to submit preferences: ${response.statusText}`);
  }

  return response.json();
}


import { Platform } from 'react-native';
import axios from 'axios';

export function getAiServiceBaseUrl(): string | null {
  const configuredUrl = process.env.EXPO_PUBLIC_AI_SERVICE_URL?.trim();
  if (configuredUrl) {
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(configuredUrl);
    } catch {
      throw new Error('EXPO_PUBLIC_AI_SERVICE_URL must be a valid absolute URL.');
    }

    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      throw new Error('EXPO_PUBLIC_AI_SERVICE_URL must use HTTP or HTTPS.');
    }

    return configuredUrl.replace(/\/+$/, '');
  }

  if (Platform.OS === 'web') {
    return 'http://localhost:8000';
  }
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000';
  }
  return null;
}

export interface PredictionPayload {
  user_id: string;
  card_id: string;
  difficulty_level: number;
  recent_accuracy: number;
  avg_response_time_ms: number;
  consecutive_correct: number;
  streak: number;
  review_count: number;
}

export interface PredictionResponse {
  card_id: string;
  success_probability: number;
  predicted_outcome: 0 | 1;
  recommended_action: 'review_now' | 'normal_schedule' | 'challenge_mode';
  model_version: string;
  key_factor: string;
  source: 'model' | 'service_fallback' | 'offline_fallback';
}

/**
 * Gửi dữ liệu hành vi ôn tập lên mô hình AI Random Forest
 */
export async function getPersonalizedRecommendation(
  payload: PredictionPayload
): Promise<PredictionResponse> {
  const fallbackProb = payload.recent_accuracy >= 0.8 ? 0.9 : 0.45;
  const offlineFallback: PredictionResponse = {
    card_id: payload.card_id,
    success_probability: fallbackProb,
    predicted_outcome: fallbackProb >= 0.6 ? 1 : 0,
    recommended_action:
      fallbackProb >= 0.85
        ? 'challenge_mode'
        : fallbackProb < 0.5
          ? 'review_now'
          : 'normal_schedule',
    model_version: 'Offline-Fallback',
    key_factor: 'Phản hồi cục bộ do chưa kết nối được container AI',
    source: 'offline_fallback',
  };

  let baseUrl: string | null;
  try {
    baseUrl = getAiServiceBaseUrl();
  } catch (error) {
    console.error('[AI Service] URL cấu hình không hợp lệ:', error);
    return offlineFallback;
  }

  if (!baseUrl) {
    console.warn('[AI Service] Cần cấu hình EXPO_PUBLIC_AI_SERVICE_URL trên iOS.');
    return offlineFallback;
  }

  try {
    const response = await axios.post<PredictionResponse>(
      `${baseUrl}/predict`,
      payload,
      { timeout: 3500 }
    );
    return {
      ...response.data,
      source: response.data.model_version.startsWith('RandomForest')
        ? 'model'
        : 'service_fallback',
    };
  } catch (error) {
    console.warn(`[AI Service] Không thể kết nối tới ${baseUrl}/predict:`, error);
    return offlineFallback;
  }
}

export interface User {
  id: string;
  name: string;
  email: string;
  streak: number;
  xp: number;
  level: number;
  lastActiveDate: string;
}

export interface Flashcard {
  id: string;
  word: string;
  phonetic: string;
  meaningVi: string;
  exampleEn: string;
  exampleVi: string;
  audioUrl?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
  // SRS parameters (Spaced Repetition System)
  interval: number; // in days
  repetition: number;
  easeFactor: number;
  dueDate: string;
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

export interface PredictionResult {
  card_id: string;
  success_probability: number;
  predicted_outcome: 0 | 1; // 1: can master, 0: needs review
  recommended_action: 'review_now' | 'normal_schedule' | 'challenge_mode';
}


import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Flashcard } from '../types';
import { INITIAL_FLASHCARDS } from '../constants/mockCards';
import { SRSReviewResult } from '../utils/srs';
import { XPEvent } from '../utils/leaderboard';
import { updateDailyStreak } from '../utils/gamification';

type HydrationStatus = 'loading' | 'ready' | 'error';

interface UserStore {
  user: User;
  cards: Flashcard[];
  selectedTopic: string;
  recentReviews: { quality: number; responseTimeMs: number }[];
  consecutiveCorrect: number;
  xpHistory: XPEvent[];
  hydrationStatus: HydrationStatus;
  setHydrationStatus: (status: HydrationStatus) => void;
  incrementStreak: () => void;
  addXP: (amount: number) => void;
  setSelectedTopic: (topicId: string) => void;
  recordReviewStats: (quality: number, responseTimeMs: number) => void;
  updateCardReview: (cardId: string, review: SRSReviewResult) => void;
  getFilteredCards: () => Flashcard[];
  getRecentAccuracy: () => number;
  getAverageResponseTime: () => number;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      user: {
        id: 'user_demo',
        name: 'Quang Minh',
        email: 'quangminh@example.com',
        streak: 4,
        xp: 280,
        level: 2,
        lastActiveDate: new Date().toISOString(),
      },
      cards: INITIAL_FLASHCARDS,
      selectedTopic: 'all',
      recentReviews: [
        { quality: 4, responseTimeMs: 2200 },
        { quality: 5, responseTimeMs: 1800 },
        { quality: 4, responseTimeMs: 2400 },
      ],
      consecutiveCorrect: 3,
      xpHistory: [],
      hydrationStatus: 'loading',
      setHydrationStatus: (status) => set({ hydrationStatus: status }),
      incrementStreak: () =>
        set((state) => {
          const streakUpdate = updateDailyStreak(
            state.user.streak,
            state.user.lastActiveDate
          );
          return {
            user: { ...state.user, ...streakUpdate },
          };
        }),
      addXP: (amount) =>
        set((state) => ({
          user: { ...state.user, xp: state.user.xp + amount },
          xpHistory: [
            ...state.xpHistory.slice(-999),
            { amount, createdAt: new Date().toISOString() },
          ],
        })),
      setSelectedTopic: (topicId: string) =>
        set({ selectedTopic: topicId }),
      getFilteredCards: () => {
        const { cards, selectedTopic } = get();
        if (selectedTopic === 'all') return cards;
        return cards.filter((c) => c.topic === selectedTopic);
      },
      recordReviewStats: (quality: number, responseTimeMs: number) => {
        set((state) => {
          const isCorrect = quality >= 3;
          const nextConsecutive = isCorrect ? state.consecutiveCorrect + 1 : 0;
          const updatedReviews = [
            ...state.recentReviews.slice(-9),
            { quality, responseTimeMs },
          ];
          return {
            consecutiveCorrect: nextConsecutive,
            recentReviews: updatedReviews,
          };
        });
      },
      updateCardReview: (cardId, review) =>
        set((state) => ({
          cards: state.cards.map((c) =>
            c.id === cardId
              ? {
                  ...c,
                  interval: review.interval,
                  repetition: review.repetition,
                  easeFactor: review.easeFactor,
                  dueDate: review.dueDate,
                }
              : c
          ),
        })),
      getRecentAccuracy: () => {
        const reviews = get().recentReviews;
        if (reviews.length === 0) return 0.8;
        const correctCount = reviews.filter((r) => r.quality >= 3).length;
        return Number((correctCount / reviews.length).toFixed(2));
      },
      getAverageResponseTime: () => {
        const reviews = get().recentReviews;
        if (reviews.length === 0) return 2500;
        const totalMs = reviews.reduce((sum, r) => sum + r.responseTimeMs, 0);
        return Math.round(totalMs / reviews.length);
      },
    }),
    {
      name: 'lixilearn-user-state-v1',
      version: 2,
      storage: createJSONStorage(() => AsyncStorage),
      migrate: (persistedState, version) => {
        if (
          version < 2 &&
          persistedState &&
          typeof persistedState === 'object' &&
          'user' in persistedState
        ) {
          const previousState = persistedState as Partial<UserStore>;
          if (previousState.user?.name === 'Sinh viên VKU') {
            return {
              ...previousState,
              user: { ...previousState.user, name: 'Quang Minh' },
            };
          }
        }

        return persistedState as UserStore;
      },
      partialize: (state) => ({
        user: state.user,
        cards: state.cards,
        selectedTopic: state.selectedTopic,
        recentReviews: state.recentReviews,
        consecutiveCorrect: state.consecutiveCorrect,
        xpHistory: state.xpHistory,
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('[Persistence] Unable to restore learner progress:', error);
          state?.setHydrationStatus('error');
          return;
        }

        state?.setHydrationStatus('ready');
      },
    }
  )
);

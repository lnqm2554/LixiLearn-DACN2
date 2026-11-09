import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useUserStore } from '../store/useUserStore';
import { calculateSRS } from '../utils/srs';
import { getPersonalizedRecommendation, PredictionResponse } from '../services/aiService';
import { TOPICS } from '../constants/mockCards';
import { getNextCardIndex } from '../utils/studyRecommendations';
import { RotateCw, Volume2, CheckCircle2, Sparkles, Brain, ArrowUpRight, AlertTriangle, Layers } from 'lucide-react-native';
import { theme } from '../constants/theme';

export default function StudyScreen() {
  const {
    user,
    selectedTopic,
    setSelectedTopic,
    getFilteredCards,
    consecutiveCorrect,
    addXP,
    incrementStreak,
    updateCardReview,
    recordReviewStats,
    getRecentAccuracy,
  } = useUserStore();

  const filteredCards = getFilteredCards();
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<PredictionResponse | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Đo thời gian phản xạ (từ lúc hiện thẻ tới lúc bấm lật)
  const cardStartTimeRef = useRef<number>(Date.now());

  const currentCard = filteredCards[currentCardIndex] || filteredCards[0];

  useEffect(() => {
    // Reset thời gian và trạng thái gợi ý khi chuyển sang thẻ mới hoặc đổi chủ đề
    cardStartTimeRef.current = Date.now();
    setIsFlipped(false);
    setAiSuggestion(null);
  }, [currentCardIndex, selectedTopic]);

  const handleSelectTopic = (topicId: string) => {
    setSelectedTopic(topicId);
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setAiSuggestion(null);
  };

  const handleFlipCard = () => {
    setIsFlipped(!isFlipped);
  };

  const handleReview = async (quality: number) => {
    if (!currentCard) return;

    const responseDuration = Date.now() - cardStartTimeRef.current;
    recordReviewStats(quality, responseDuration);

    // 1. Cập nhật chu kỳ theo thuật toán SM-2
    const result = calculateSRS(
      quality,
      currentCard.repetition,
      currentCard.interval,
      currentCard.easeFactor
    );
    updateCardReview(currentCard.id, result);

    const earnedXP = quality >= 3 ? 15 : 5;
    addXP(earnedXP);

    // 2. Gọi mô hình AI Random Forest dự đoán khả năng nắm vững
    setIsAiLoading(true);
    const difficultyLevelNumber =
      currentCard.difficulty === 'easy' ? 1 : currentCard.difficulty === 'medium' ? 2 : 3;

    try {
      const aiResponse = await getPersonalizedRecommendation({
        user_id: user.id,
        card_id: currentCard.id,
        difficulty_level: difficultyLevelNumber,
        recent_accuracy: getRecentAccuracy(),
        avg_response_time_ms: Math.min(responseDuration, 9000),
        consecutive_correct: quality >= 3 ? consecutiveCorrect + 1 : 0,
        streak: user.streak,
        review_count: currentCard.repetition + 1,
      });

      setAiSuggestion(aiResponse);
    } catch (err) {
      console.log('AI prediction call bypassed:', err);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleNextCard = () => {
    const nextCardIndex = getNextCardIndex(
      filteredCards,
      currentCardIndex,
      aiSuggestion?.recommended_action
    );
    setAiSuggestion(null);
    if (nextCardIndex !== null) {
      setCurrentCardIndex(nextCardIndex);
    } else {
      incrementStreak();
      Alert.alert(
        'Hoàn thành chủ đề rồi nè! ☕✨',
        'Tiến độ ôn tập đã được lưu. Bạn đã duy trì Streak của mình!',
        [{ text: 'Tuyệt vời', onPress: () => setCurrentCardIndex(0) }]
      );
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Topic Horizontal Filter Pills */}
      <View style={styles.topicFilterWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.topicScroll}>
          {TOPICS.map((t) => {
            const isActive = selectedTopic === t.id;
            return (
              <TouchableOpacity
                key={t.id}
                style={[styles.topicPill, isActive && styles.topicPillActive]}
                onPress={() => handleSelectTopic(t.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.topicPillEmoji}>{t.emoji}</Text>
                <Text style={[styles.topicPillText, isActive && styles.topicPillTextActive]}>
                  {t.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Progress header */}
      {filteredCards.length > 0 && (
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            Thẻ {currentCardIndex + 1} trên {filteredCards.length}
          </Text>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${((currentCardIndex + 1) / filteredCards.length) * 100}%` },
              ]}
            />
          </View>
        </View>
      )}

      {/* Main Flip Card */}
      {currentCard ? (
        <TouchableOpacity
          activeOpacity={0.92}
          style={[styles.card, isFlipped && styles.cardFlipped]}
          onPress={handleFlipCard}
        >
          <View style={styles.cardHeader}>
            <View style={styles.tagBadge}>
              <Text style={styles.tagText}>{currentCard.topic.toUpperCase()}</Text>
            </View>
            <View style={styles.flipHintBadge}>
              <RotateCw size={12} color={theme.colors.textSecondary} />
              <Text style={styles.flipHintText}>{isFlipped ? 'Mặt sau' : 'Chạm để lật'}</Text>
            </View>
          </View>

          {!isFlipped ? (
            <View style={styles.cardFrontContent}>
              <Text style={styles.wordText}>{currentCard.word}</Text>
              <Text style={styles.phoneticText}>{currentCard.phonetic}</Text>
              <View style={styles.audioPreview}>
                <Volume2 size={18} color={theme.colors.primary} />
                <Text style={styles.audioText}>Phát âm chuẩn</Text>
              </View>
            </View>
          ) : (
            <View style={styles.cardBackContent}>
              <Text style={styles.meaningLabel}>Ý nghĩa:</Text>
              <Text style={styles.meaningText}>{currentCard.meaningVi}</Text>

              <View style={styles.exampleWrapper}>
                <Text style={styles.exampleEn}>"{currentCard.exampleEn}"</Text>
                <Text style={styles.exampleVi}>{currentCard.exampleVi}</Text>
              </View>
            </View>
          )}
        </TouchableOpacity>
      ) : (
        <View style={styles.emptyContainer}>
          <CheckCircle2 size={54} color={theme.colors.primary} />
          <Text style={styles.emptyTitle}>Chưa có thẻ trong chủ đề này</Text>
          <Text style={styles.emptySub}>Hãy chọn chủ đề khác để tiếp tục ôn tập nhé.</Text>
        </View>
      )}

      {/* AI Personalized Recommendation Card */}
      {isAiLoading && (
        <View style={styles.aiLoadingBox}>
          <ActivityIndicator color={theme.colors.primary} size="small" />
          <Text style={styles.aiLoadingText}>Mô hình AI đang phân tích phản xạ...</Text>
        </View>
      )}

      {aiSuggestion && (
        <View style={styles.aiResultCard}>
          <View style={styles.aiResultHeader}>
            <View style={styles.aiBrainIcon}>
              <Brain size={18} color="#FFFDF9" />
            </View>
            <Text style={styles.aiResultTitle}>
              {aiSuggestion.source === 'model'
                ? 'Phân tích từ Mô hình Học máy'
                : 'Gợi ý học tập dự phòng'}
            </Text>
            <View style={styles.confidenceTag}>
              <Text style={styles.confidenceText}>
                Độ chắc: {(aiSuggestion.success_probability * 100).toFixed(0)}%
              </Text>
            </View>
          </View>

          <Text style={styles.aiFactorText}>{aiSuggestion.key_factor}</Text>

          <View style={styles.aiActionRow}>
            {aiSuggestion.recommended_action === 'challenge_mode' ? (
              <View style={[styles.actionPill, { backgroundColor: '#EAF4EE' }]}>
                <ArrowUpRight size={14} color="#276749" />
                <Text style={[styles.actionPillText, { color: '#276749' }]}>
                  Đề xuất: Chuyển sang thẻ nâng cao 🚀
                </Text>
              </View>
            ) : aiSuggestion.recommended_action === 'review_now' ? (
              <View style={[styles.actionPill, { backgroundColor: '#FEF2F2' }]}>
                <AlertTriangle size={14} color="#991B1B" />
                <Text style={[styles.actionPillText, { color: '#991B1B' }]}>
                  Đề xuất: Tăng tần suất củng cố trí nhớ
                </Text>
              </View>
            ) : (
              <View style={[styles.actionPill, { backgroundColor: '#F0F9FF' }]}>
                <CheckCircle2 size={14} color="#0369A1" />
                <Text style={[styles.actionPillText, { color: '#0369A1' }]}>
                  Đề xuất: Giữ nguyên nhịp điệu SRS tiêu chuẩn
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity style={styles.continueBtn} onPress={handleNextCard} activeOpacity={0.85}>
            <Text style={styles.continueBtnText}>
              {aiSuggestion.recommended_action === 'review_now'
                ? 'Ưu tiên thẻ cần ôn'
                : aiSuggestion.recommended_action === 'challenge_mode'
                  ? 'Chuyển sang thẻ nâng cao'
                  : 'Tiếp tục thẻ kế tiếp'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* SRS Feedback Buttons */}
      {isFlipped && !aiSuggestion && !isAiLoading && (
        <View style={styles.actionContainer}>
          <Text style={styles.actionInstruction}>Độ quen thuộc của từ vựng này đối với bạn:</Text>
          <View style={styles.buttonsRow}>
            <TouchableOpacity
              style={[styles.srsBtn, { backgroundColor: theme.colors.againBg }]}
              onPress={() => handleReview(1)}
              activeOpacity={0.8}
            >
              <Text style={[styles.srsBtnTitle, { color: theme.colors.againText }]}>Hơi lạ lẫm</Text>
              <Text style={[styles.srsBtnSub, { color: theme.colors.againText }]}>Cần ôn lại</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.srsBtn, { backgroundColor: theme.colors.goodBg }]}
              onPress={() => handleReview(4)}
              activeOpacity={0.8}
            >
              <Text style={[styles.srsBtnTitle, { color: theme.colors.goodText }]}>Nhớ tốt</Text>
              <Text style={[styles.srsBtnSub, { color: theme.colors.goodText }]}>+15 XP</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.srsBtn, { backgroundColor: theme.colors.easyBg }]}
              onPress={() => handleReview(5)}
              activeOpacity={0.8}
            >
              <Text style={[styles.srsBtnTitle, { color: theme.colors.easyText }]}>Rất dễ 🌿</Text>
              <Text style={[styles.srsBtnSub, { color: theme.colors.easyText }]}>Giãn cách xa</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {!isFlipped && (
        <View style={styles.promptContainer}>
          <Sparkles size={16} color={theme.colors.primary} />
          <Text style={styles.promptText}>Hình dung nghĩa từ vựng một chút trước khi lật thẻ nhé</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: theme.colors.background,
    flexGrow: 1,
    alignItems: 'center',
  },
  topicFilterWrapper: {
    width: '100%',
    marginBottom: 16,
  },
  topicScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  topicPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.surface,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  topicPillActive: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primary,
  },
  topicPillEmoji: {
    fontSize: 14,
  },
  topicPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  topicPillTextActive: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  progressContainer: {
    width: '100%',
    marginBottom: 18,
  },
  progressText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '600',
    marginBottom: 6,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: theme.colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
  },
  card: {
    width: '100%',
    minHeight: 310,
    backgroundColor: theme.colors.surface,
    borderRadius: 28,
    padding: 26,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#2E2824',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 3,
    justifyContent: 'space-between',
  },
  cardFlipped: {
    backgroundColor: '#FAF5EE',
    borderColor: theme.colors.primaryLight,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tagBadge: {
    backgroundColor: theme.colors.background,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    letterSpacing: 0.8,
  },
  flipHintBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.background,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  flipHintText: {
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  cardFrontContent: {
    alignItems: 'center',
    marginVertical: 36,
  },
  wordText: {
    fontSize: 32,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    marginBottom: 8,
  },
  phoneticText: {
    fontSize: 17,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: 18,
  },
  audioPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.primaryLight,
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
  },
  audioText: {
    fontSize: 13,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  cardBackContent: {
    marginVertical: 14,
  },
  meaningLabel: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  meaningText: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.primary,
    marginTop: 4,
    marginBottom: 14,
  },
  exampleWrapper: {
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  exampleEn: {
    fontSize: 14,
    color: theme.colors.textPrimary,
    fontWeight: '600',
    marginBottom: 6,
  },
  exampleVi: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  aiLoadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 20,
    backgroundColor: theme.colors.surface,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  aiLoadingText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  aiResultCard: {
    width: '100%',
    backgroundColor: theme.colors.surface,
    borderRadius: 22,
    padding: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#2E2824',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  aiResultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  aiBrainIcon: {
    backgroundColor: theme.colors.primary,
    padding: 6,
    borderRadius: 10,
  },
  aiResultTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    flex: 1,
  },
  confidenceTag: {
    backgroundColor: theme.colors.primaryLight,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  confidenceText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  aiFactorText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginBottom: 14,
    lineHeight: 18,
  },
  aiActionRow: {
    marginBottom: 16,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  actionPillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  continueBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  continueBtnText: {
    color: '#FFFDF9',
    fontSize: 14,
    fontWeight: '700',
  },
  actionContainer: {
    width: '100%',
    marginTop: 22,
  },
  actionInstruction: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  srsBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: 'center',
  },
  srsBtnTitle: {
    fontWeight: '700',
    fontSize: 13,
  },
  srsBtnSub: {
    fontSize: 11,
    marginTop: 2,
    opacity: 0.85,
  },
  promptContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 28,
  },
  promptText: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  emptyContainer: {
    width: '100%',
    minHeight: 250,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginTop: 14,
  },
  emptySub: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
});

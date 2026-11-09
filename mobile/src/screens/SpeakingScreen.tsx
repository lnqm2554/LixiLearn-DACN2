import React, { useRef, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import * as Speech from 'expo-speech';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import { useUserStore } from '../store/useUserStore';
import { evaluateTranscriptMatch, TranscriptMatchResult } from '../utils/speechEvaluation';
import { Volume2, Mic, MicOff, RefreshCw, CheckCircle2, Sparkles, Award } from 'lucide-react-native';
import { theme } from '../constants/theme';

export default function SpeakingScreen() {
  const { cards, addXP } = useUserStore();
  const [selectedCardIndex, setSelectedCardIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [evaluation, setEvaluation] = useState<TranscriptMatchResult | null>(null);
  const [recognitionError, setRecognitionError] = useState<string | null>(null);
  const hasReceivedReward = useRef(false);

  const currentCard = cards[selectedCardIndex] || cards[0];

  useSpeechRecognitionEvent('result', (event) => {
    if (!event.isFinal) return;

    const spoken = event.results[0]?.transcript.trim();
    if (!spoken) {
      setRecognitionError('Không nhận diện được lời nói. Hãy thử lại trong môi trường yên tĩnh hơn.');
      return;
    }

    setTranscribedText(spoken);
    const result = evaluateTranscriptMatch(spoken, currentCard.word);
    setEvaluation(result);
    setRecognitionError(null);
    if (result.similarityScore >= 70 && !hasReceivedReward.current) {
      addXP(20);
      hasReceivedReward.current = true;
    }
  });

  useSpeechRecognitionEvent('error', (event) => {
    setRecognitionError(
      event.error === 'not-allowed'
        ? 'Cần cấp quyền micro và nhận dạng giọng nói để luyện tập.'
        : `Nhận dạng giọng nói gặp lỗi (${event.error}). Hãy thử lại.`
    );
    setIsRecording(false);
  });

  useSpeechRecognitionEvent('end', () => {
    setIsRecording(false);
  });

  // Nghe phát âm chuẩn người bản xứ
  const handlePlayNativeAudio = () => {
    Speech.stop();
    Speech.speak(currentCard.word, {
      language: 'en-US',
      pitch: 1.0,
      rate: 0.85, // Tốc độ hơi chậm một chút để nghe rõ âm tiết
    });
  };

  const handleToggleRecord = async () => {
    if (isRecording) {
      ExpoSpeechRecognitionModule.stop();
      return;
    }

    setRecognitionError(null);
    setTranscribedText('');
    setEvaluation(null);
    hasReceivedReward.current = false;

    try {
      const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!permission.granted) {
        setRecognitionError('Bạn cần cấp quyền micro và nhận dạng giọng nói để tiếp tục.');
        return;
      }

      ExpoSpeechRecognitionModule.start({
        lang: 'en-US',
        interimResults: false,
        maxAlternatives: 1,
        continuous: false,
      });
      setIsRecording(true);
    } catch (error) {
      console.error('[Speech Recognition] Unable to start recognition:', error);
      setRecognitionError('Không thể bắt đầu nhận dạng giọng nói. Hãy thử lại.');
      setIsRecording(false);
    }
  };

  const handleNextWord = () => {
    setTranscribedText('');
    setEvaluation(null);
    setSelectedCardIndex((prev) => (prev + 1) % cards.length);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Target Word Hero Card */}
      <View style={styles.heroCard}>
        <Text style={styles.topicBadge}>{currentCard.topic.toUpperCase()}</Text>
        <Text style={styles.targetWord}>{currentCard.word}</Text>
        <Text style={styles.phoneticText}>{currentCard.phonetic}</Text>
        <Text style={styles.meaningText}>{currentCard.meaningVi}</Text>

        {/* Listen Native Pronunciation Button */}
        <TouchableOpacity
          style={styles.listenBtn}
          onPress={handlePlayNativeAudio}
          activeOpacity={0.85}
        >
          <Volume2 size={20} color="#FFFDF9" />
          <Text style={styles.listenBtnText}>Nghe mẫu bản xứ (US)</Text>
        </TouchableOpacity>
      </View>

      {/* Recording & Evaluation Area */}
      <View style={styles.practiceContainer}>
        <Text style={styles.instructionTitle}>Bây giờ đến lượt bạn!</Text>
        <Text style={styles.instructionSub}>
          Nói từ tiếng Anh sau khi cấp quyền micro. Ứng dụng sẽ đối chiếu văn bản được nhận dạng.
        </Text>

        {/* Big Animated Mic Button */}
        <View style={styles.micWrapper}>
          <TouchableOpacity
            style={[styles.micBtn, isRecording && styles.micBtnRecording]}
            onPress={handleToggleRecord}
            activeOpacity={0.8}
          >
            {isRecording ? (
              <MicOff size={36} color="#FFFDF9" />
            ) : (
              <Mic size={36} color="#FFFDF9" />
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.recordStatusText}>
          {isRecording ? '🎙️ Đang lắng nghe giọng bạn...' : 'Chạm vào micro để bắt đầu nói'}
        </Text>
        {recognitionError && (
          <Text style={styles.errorText}>{recognitionError}</Text>
        )}
      </View>

      {/* Speech Evaluation Score Card */}
      {evaluation && (
        <View style={styles.resultCard}>
          <View style={styles.scoreRow}>
            <View>
              <Text style={styles.scoreLabel}>Độ khớp văn bản nhận diện</Text>
              <Text style={styles.userSpokeText}>
                Bạn đã nói: <Text style={styles.userSpokeHighlight}>"{transcribedText}"</Text>
              </Text>
            </View>
            <View
              style={[
                styles.scoreBadge,
                evaluation.similarityScore >= 80
                  ? styles.scoreExcellent
                  : evaluation.similarityScore >= 60
                  ? styles.scoreGood
                  : styles.scorePractice,
              ]}
            >
              <Text style={styles.scoreBadgeNumber}>{evaluation.similarityScore}%</Text>
            </View>
          </View>

          <View style={styles.feedbackBox}>
            <Sparkles size={16} color={theme.colors.primary} />
            <Text style={styles.feedbackText}>
              {evaluation.feedbackText} Kết quả này so sánh văn bản, chưa phân tích âm vị.
            </Text>
          </View>

          {evaluation.similarityScore >= 70 && (
            <View style={styles.rewardBox}>
              <Award size={16} color="#15803D" />
              <Text style={styles.rewardText}>Phát âm chuẩn xác! Nhận thêm +20 XP</Text>
            </View>
          )}

          <TouchableOpacity style={styles.nextWordBtn} onPress={handleNextWord} activeOpacity={0.85}>
            <Text style={styles.nextWordBtnText}>Luyện từ vựng tiếp theo</Text>
            <RefreshCw size={16} color="#FFFDF9" />
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: 22,
    paddingBottom: 40,
    alignItems: 'center',
  },
  heroCard: {
    width: '100%',
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#2E2824',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    marginBottom: 20,
  },
  topicBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  targetWord: {
    fontSize: 32,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    marginBottom: 6,
  },
  phoneticText: {
    fontSize: 18,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  meaningText: {
    fontSize: 15,
    color: theme.colors.accent,
    fontWeight: '600',
    marginBottom: 18,
  },
  listenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  listenBtnText: {
    color: '#FFFDF9',
    fontSize: 13,
    fontWeight: '700',
  },
  practiceContainer: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 12,
  },
  instructionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 6,
  },
  instructionSub: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  micWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  micBtn: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
  micBtnRecording: {
    backgroundColor: '#DC2626',
    transform: [{ scale: 1.08 }],
  },
  recordStatusText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  errorText: {
    marginTop: 10,
    color: '#B91C1C',
    fontSize: 13,
    textAlign: 'center',
  },
  resultCard: {
    width: '100%',
    backgroundColor: theme.colors.surface,
    borderRadius: 22,
    padding: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  scoreLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  userSpokeText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  userSpokeHighlight: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  scoreBadge: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 16,
  },
  scoreExcellent: {
    backgroundColor: '#DCFCE7',
  },
  scoreGood: {
    backgroundColor: '#FEF3C7',
  },
  scorePractice: {
    backgroundColor: '#FEE2E2',
  },
  scoreBadgeNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
  },
  feedbackBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.background,
    padding: 12,
    borderRadius: 14,
    marginBottom: 12,
  },
  feedbackText: {
    fontSize: 13,
    color: theme.colors.textPrimary,
    flex: 1,
  },
  rewardBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0FDF4',
    padding: 10,
    borderRadius: 12,
    marginBottom: 16,
  },
  rewardText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  nextWordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    borderRadius: 14,
  },
  nextWordBtnText: {
    color: '#FFFDF9',
    fontSize: 14,
    fontWeight: '700',
  },
});
